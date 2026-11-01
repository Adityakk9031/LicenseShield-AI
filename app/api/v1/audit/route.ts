import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { checkLicenseCompatibility } from '@/lib/license-engine';
import {
  evaluatePackageMetadata,
  parsePackageSpecString,
  buildAutoCorrectionPlan,
  SAFE_REPLACEMENT_MAP,
} from '@/lib/threat-guard';
import {
  verifyApiKey,
  verifyEscrowLock,
  settleEscrowPayment,
  verifyEip712Voucher,
  settleEip712Voucher,
  getEip712Domain,
  EIP712_VOUCHER_TYPES,
  saveAuditLog,
  Eip712AuditVoucher,
} from '@/lib/payment';
import { withTimeout, EXTERNAL_FETCH_TIMEOUT_MS, GEMINI_TIMEOUT_MS } from '@/lib/timeout';

const MAX_PACKAGES_PER_AUDIT = 60;

export async function POST(req: Request) {
  try {
    // ── 1. Hybrid Auth & Payment Verification ────────────────────────────────
    const authHeader = req.headers.get('Authorization') || '';
    const auditIdHeader = req.headers.get('X-Audit-ID') || '';
    const signatureHeader = req.headers.get('X-Payment-Signature') || '';
    const voucherHeader = req.headers.get('X-Payment-Voucher') || '';

    let isAuthorized = false;
    let authModel: 'ModelA_SaaS' | 'ModelB_Web3' | 'ModelB_EIP712_Vault' | null = null;
    let authenticatedUserId: string | undefined = undefined;
    let verifiedVoucher: Eip712AuditVoucher | undefined = undefined;

    // Check Model A (Web2 SaaS Bearer API Key via Prisma & env)
    if (authHeader) {
      const authRes = await verifyApiKey(authHeader);
      if (authRes.authorized) {
        isAuthorized = true;
        authModel = 'ModelA_SaaS';
        authenticatedUserId = authRes.userId;
      }
    }

    // Read the raw body once: JSON for parsing, exact bytes for escrow / EIP-712 payload binding
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
    const auditId =
      auditIdHeader ||
      body.auditId ||
      body.orderId ||
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check Model B2 (Web3 Deposit Vault + EIP-712 Cryptographic Signature — <1ms off-chain verification)
    if (!isAuthorized && signatureHeader && (voucherHeader || body.voucher)) {
      const voucherCheck = verifyEip712Voucher(
        signatureHeader,
        voucherHeader || body.voucher,
        rawBody
      );
      if (voucherCheck.valid && voucherCheck.voucher) {
        isAuthorized = true;
        authModel = 'ModelB_EIP712_Vault';
        verifiedVoucher = voucherCheck.voucher;
      }
    }

    // Check Model B1 (Web3 On-Chain Per-Scan Escrow Lock) if not authorized via API key or EIP-712
    const lockCandidateId = auditIdHeader || signatureHeader || body.auditId || body.orderId;
    if (!isAuthorized && lockCandidateId) {
      const isLocked = await verifyEscrowLock(lockCandidateId, rawBody);
      if (isLocked) {
        isAuthorized = true;
        authModel = 'ModelB_Web3';
      }
    }

    // Challenge Mode: HTTP 402 Payment Required
    if (!isAuthorized) {
      const escrowContract =
        process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
      return NextResponse.json(
        {
          status: 402,
          error: 'Payment Required',
          message:
            'Valid Web2 API key, EIP-712 Deposit Vault cryptographic signature, or Web3 $0.01 USDC escrow lock required.',
          paymentInstructions: {
            amount: '0.01',
            token: 'USDC',
            network: 'eip155:84532',
            contractAddress: escrowContract,
            lockFunction: 'lockAuditFee(bytes32 auditId, bytes32 payloadHash)',
            vaultDepositFunction: 'depositVault(uint256 amount)',
            eip712Domain: getEip712Domain(escrowContract),
            eip712Types: EIP712_VOUCHER_TYPES,
            payloadHashSpec:
              'keccak256(utf8Bytes(exact JSON request body)) — lock or sign with this hash, then send the byte-identical body',
          },
        },
        { status: 402 }
      );
    }

    // ── 2. Payload Parsing ──────────────────────────────────────────────────
    let targetLicense = 'MIT';
    let rawDependencies: any[] = [];

    if (body.targetLicense || body.projectLicense) {
      targetLicense = body.targetLicense || body.projectLicense;
    }

    if (Array.isArray(body.dependencies)) {
      rawDependencies = body.dependencies;
    } else if (Array.isArray(body.packages)) {
      rawDependencies = body.packages.map((p: any) =>
        p.version ? `${p.name}@${p.version}` : p.name || p
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid request payload. Expected "dependencies" or "packages" array.' },
        { status: 400 }
      );
    }

    if (rawDependencies.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request payload. "dependencies"/"packages" array must not be empty.' },
        { status: 400 }
      );
    }

    const boundedDependencies = rawDependencies.slice(0, MAX_PACKAGES_PER_AUDIT);

    // ── 3. Concurrent Multi-Pillar Threat Scan (NPM + Hallucination + Typosquat + OSV) ──
    const auditResults = await Promise.all(
      boundedDependencies.map(async (dep) => {
        const parsedSpec = parsePackageSpecString(dep);
        const packageName = parsedSpec.name;
        const packageVersion = parsedSpec.version;

        const [npmRes, osvRes] = await Promise.allSettled([
          withTimeout(
            fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`),
            EXTERNAL_FETCH_TIMEOUT_MS,
            `NPM fetch for ${packageName}`
          ),
          withTimeout(
            fetch('https://api.osv.dev/v1/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                package: { name: packageName, ecosystem: 'npm' },
                ...(packageVersion && packageVersion !== 'latest'
                  ? { version: packageVersion }
                  : {}),
              }),
              signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
            }),
            EXTERNAL_FETCH_TIMEOUT_MS + 1_000,
            `OSV query for ${packageName}`
          ),
        ]);

        let npmStatus: number | null = null;
        let npmData: any | null = null;

        if (npmRes.status === 'fulfilled') {
          npmStatus = npmRes.value.status;
          if (npmRes.value.ok) {
            try {
              npmData = await npmRes.value.json();
            } catch (e) {
              console.error(`Error parsing NPM response for ${packageName}:`, e);
            }
          }
        }

        let vulnerabilities: any[] = [];
        if (osvRes.status === 'fulfilled' && osvRes.value.ok) {
          try {
            const osvData = await osvRes.value.json();
            vulnerabilities = osvData.vulns || [];
          } catch (e) {
            console.error(`Error parsing OSV response for ${packageName}:`, e);
          }
        }

        const inspection = evaluatePackageMetadata(
          packageName,
          packageVersion,
          npmStatus,
          npmData
        );

        return {
          name: packageName,
          version: inspection.resolvedVersion,
          license: inspection.resolvedLicense,
          existsOnRegistry: inspection.existsOnRegistry,
          deprecated: inspection.deprecatedMessage,
          typosquatTarget: inspection.typosquat.targetPackage || null,
          threatRisks: inspection.threatRisks,
          vulnerabilities,
        };
      })
    );

    // ── 4. Deterministic Threat & License Risk Collection ───────────────────
    const risks: any[] = [];
    const deterministicSuggestions: string[] = [];

    auditResults.forEach((pkg) => {
      // Pillar 2 & 3 threats (Hallucination, Typosquatting, Deprecated)
      for (const tr of pkg.threatRisks) {
        risks.push(tr);
        if (tr.type === 'TYPOSQUATTING' && tr.suggestedReplacement) {
          deterministicSuggestions.push(
            `Typosquatting alert: Replace "${pkg.name}" immediately with canonical package "${tr.suggestedReplacement}".`
          );
        } else if (tr.type === 'HALLUCINATION') {
          deterministicSuggestions.push(
            `Hallucinated package "${pkg.name}" does not exist on NPM (404). Remove it to prevent slopsquatting malware.`
          );
        } else if (tr.type === 'DEPRECATED') {
          deterministicSuggestions.push(
            tr.suggestedReplacement
              ? `Replace deprecated package "${pkg.name}" with modern alternative "${tr.suggestedReplacement}".`
              : `Replace deprecated package "${pkg.name}" with an actively maintained alternative.`
          );
        }
      }

      // Pillar 1: License Compatibility (skip redundant UNKNOWN_LICENSE if already flagged as 404 hallucination)
      const isHallucinated = pkg.threatRisks.some((r) => r.type === 'HALLUCINATION');
      if (!isHallucinated) {
        const conflict = checkLicenseCompatibility(pkg.name, pkg.license, targetLicense);
        if (conflict) {
          risks.push(conflict);
          const mappedAlt = SAFE_REPLACEMENT_MAP[pkg.name.toLowerCase()];
          deterministicSuggestions.push(
            conflict.severity === 'HIGH'
              ? `Replace ${pkg.name} (${pkg.license}) with a ${targetLicense}-compatible alternative${mappedAlt ? ` such as ${mappedAlt}` : ''}.`
              : `Review license terms for ${pkg.name} (${pkg.license}).`
          );
        }
      }

      // Pillar 3: OSV Vulnerability Check
      if (pkg.vulnerabilities.length > 0) {
        risks.push({
          package: pkg.name,
          type: 'VULNERABILITY',
          severity: 'HIGH',
          detail: `${pkg.vulnerabilities.length} known vulnerabilities (e.g. ${pkg.vulnerabilities[0].id})`,
        });
        deterministicSuggestions.push(
          `Upgrade or replace ${pkg.name} to remediate ${pkg.vulnerabilities.length} known CVEs.`
        );
      }
    });

    const hasDeterministicHighRisk = risks.some((r) => r.severity === 'HIGH');

    // ── 5. AI Audit Analysis (Gemini 3.5 Flash) ──────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    let parsedVerdict: {
      status: 'APPROVED' | 'FLAGGED';
      reason: string;
      suggestedAlternatives: string[];
    } | null = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `
You are the enterprise dependency security, compliance, and anti-hallucination firewall for LicenseShield AI.
Analyze the following dependencies across 3 pillars against target policy "${targetLicense}":
1. License Compliance (copyleft/viral conflicts like AGPL-3.0, GPL-3.0, SSPL-1.0).
2. Security & Malware Guard (AI hallucinated non-existent packages, typosquatting attacks).
3. Vulnerability & Deprecation Check (OSV CVEs and deprecated libraries).

Evaluated Dependencies:
${JSON.stringify(auditResults, null, 2)}

Instructions:
1. Set status to FLAGGED if ANY license conflict, hallucinated package, typosquatting attempt, deprecation, or CVE vulnerability exists. Otherwise APPROVED.
2. Provide a clear, authoritative 2-sentence reason explaining the exact threat or compliance finding.
3. Provide concrete npm package alternatives if FLAGGED.
4. Return output strictly matching the JSON schema.
`;

        const geminiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  status: {
                    type: Type.STRING,
                    enum: ['APPROVED', 'FLAGGED'],
                    description: 'FLAGGED if any license conflicts, hallucinations, typosquats, or CVE risks exist, otherwise APPROVED.',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Clear 2-sentence explanation of the exact risk context.',
                  },
                  suggestedAlternatives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Actionable alternatives to replace the flagged packages.',
                  },
                },
                required: ['status', 'reason', 'suggestedAlternatives'],
              },
            },
          }),
          GEMINI_TIMEOUT_MS,
          'Gemini audit analysis'
        );

        if (geminiResponse.text) {
          parsedVerdict = JSON.parse(geminiResponse.text);
        }
      } catch (geminiError) {
        console.error('Gemini AI audit failed, falling back to deterministic rule engine:', geminiError);
      }
    }

    if (!parsedVerdict) {
      const status = hasDeterministicHighRisk || risks.length > 0 ? 'FLAGGED' : 'APPROVED';
      parsedVerdict = {
        status,
        reason:
          status === 'FLAGGED'
            ? `Audit flagged due to compliance, hallucination, or security risks in: ${Array.from(new Set(risks.map((r) => r.package))).join(', ')}.`
            : 'All dependency licenses, registry existence, and vulnerability checks passed.',
        suggestedAlternatives: Array.from(new Set(deterministicSuggestions)),
      };
    } else if (hasDeterministicHighRisk && parsedVerdict.status === 'APPROVED') {
      // Deterministic Guardrail Override: never allow LLM hallucination or prompt injection to approve a HIGH risk
      parsedVerdict.status = 'FLAGGED';
      parsedVerdict.reason = `[Deterministic Guardrail Enforced] High-severity risks detected in ${Array.from(new Set(risks.filter((r) => r.severity === 'HIGH').map((r) => r.package))).join(', ')}. ${parsedVerdict.reason}`;
      parsedVerdict.suggestedAlternatives = Array.from(
        new Set([...deterministicSuggestions, ...(parsedVerdict.suggestedAlternatives || [])])
      );
    }

    // Build A2A Auto-Correction Plan
    const autoCorrection = buildAutoCorrectionPlan(
      auditResults.map((pkg) => {
        const pkgRisks = risks.filter((r) => r.package === pkg.name);
        const isFlagged = pkgRisks.length > 0;
        const primaryRisk = pkgRisks[0];
        return {
          package: pkg.name,
          version: pkg.version,
          status: isFlagged ? 'FLAGGED' : 'APPROVED',
          riskType:
            primaryRisk?.type === 'VULNERABILITY'
              ? 'CRITICAL_CVE'
              : primaryRisk?.type || 'NONE',
          suggestedReplacement: pkg.typosquatTarget || primaryRisk?.suggestedReplacement || null,
        };
      }),
      body.command
    );

    // ── 6. Web3 On-Chain Settlement (Escrow or EIP-712 Deposit Vault) ────────
    let settlementTxHash: string | null = null;
    if (authModel === 'ModelB_Web3' && auditId) {
      settleEscrowPayment(auditId)
        .then((txHash) => {
          if (txHash) console.log(`[Audit] Async escrow settlement confirmed for ${auditId}: ${txHash}`);
        })
        .catch((err) => console.error(`[Audit] Async escrow settlement failed for ${auditId}:`, err));
    } else if (authModel === 'ModelB_EIP712_Vault' && verifiedVoucher && signatureHeader) {
      settleEip712Voucher(verifiedVoucher, signatureHeader)
        .then((txHash) => {
          if (txHash) console.log(`[Audit] Async EIP-712 vault settlement confirmed for ${auditId}: ${txHash}`);
        })
        .catch((err) => console.error(`[Audit] Async EIP-712 vault settlement failed for ${auditId}:`, err));
    }

    // ── 7. Construct Final Response Payload & Save Audit Log ──────────────────
    const reportPayload = {
      auditId,
      status: parsedVerdict.status,
      reason: parsedVerdict.reason,
      suggestedAlternatives: parsedVerdict.suggestedAlternatives,
      risks,
      suggestions: parsedVerdict.suggestedAlternatives,
      autoCorrection,
      aiAnalysis: parsedVerdict.reason,
      authModel,
      settlementTxHash,
      scannedAt: new Date().toISOString(),
    };

    await saveAuditLog({
      auditId,
      userId: authenticatedUserId || null,
      billedVia:
        authModel === 'ModelB_Web3' || authModel === 'ModelB_EIP712_Vault'
          ? 'BASE_SEPOLIA_USDC'
          : 'STRIPE_SUBSCRIPTION',
      targetLicense,
      packagesScanned: auditResults,
      reportOutput: reportPayload,
    });

    return NextResponse.json(reportPayload);
  } catch (error) {
    console.error('Audit API handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
