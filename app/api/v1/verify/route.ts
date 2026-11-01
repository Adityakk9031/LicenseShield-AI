import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkSandboxRateLimit, clearSandboxRateLimit, clientIpFromRequest } from '@/lib/rate-limit';
import { withTimeout, EXTERNAL_FETCH_TIMEOUT_MS, GEMINI_TIMEOUT_MS } from '@/lib/timeout';
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
  verifyEip712Voucher,
  settleEip712Voucher,
  saveAuditLog,
  Eip712AuditVoucher,
} from '@/lib/payment';

const MAX_PACKAGES_PER_VERIFY = 60;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const auditIdHeader = req.headers.get('X-Audit-ID') || '';
    const signatureHeader = req.headers.get('X-Payment-Signature') || '';
    const voucherHeader = req.headers.get('X-Payment-Voucher') || '';

    let isAuthorized = false;
    let authModel: 'ModelA_SaaS' | 'ModelB_Web3' | 'ModelB_EIP712_Vault' | 'Sandbox_Guest' = 'Sandbox_Guest';
    let authenticatedUserId: string | undefined = undefined;
    let verifiedVoucher: Eip712AuditVoucher | undefined = undefined;

    // Check Model A (Bearer API Key)
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
      `vfy_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Check Model B2 (Web3 Deposit Vault + EIP-712 Cryptographic Signature)
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

    // Check Model B1 (Web3 Escrow Lock)
    const lockCandidateId = auditIdHeader || signatureHeader;
    if (!isAuthorized && lockCandidateId) {
      const isLocked = await verifyEscrowLock(auditId, rawBody);
      if (isLocked) {
        isAuthorized = true;
        authModel = 'ModelB_Web3';
      }
    }

    // Sandbox / public guest execution — rate limited per IP so the free
    // pipeline cannot be abused for unlimited Gemini spend.
    if (!isAuthorized) {
      const clientIp = clientIpFromRequest(req);
      const sandboxCheck = checkSandboxRateLimit(clientIp);
      if (!sandboxCheck.allowed) {
        return NextResponse.json(
          {
            error:
              'Sandbox rate limit exceeded. Use a valid API key (Model A), an EIP-712 Deposit Vault signature, or a $0.01 USDC escrow lock (Model B) for production audits.',
            retryAfterSeconds: sandboxCheck.retryAfterSeconds,
          },
          { status: 429, headers: { 'Retry-After': String(sandboxCheck.retryAfterSeconds) } }
        );
      }
      isAuthorized = true;
      authModel = 'Sandbox_Guest';
    }

    // Reject empty audit requests instead of silently scanning default packages.
    const hasExplicitPackages =
      (Array.isArray(body.packages) && body.packages.length > 0) ||
      (Array.isArray(body.dependencies) && body.dependencies.length > 0) ||
      (typeof body.command === 'string' && body.command.trim().length > 0);

    if (!hasExplicitPackages) {
      clearSandboxRateLimit(req);
      return NextResponse.json(
        {
          error:
            'Invalid request payload. Expected a non-empty "packages"/"dependencies" array or an "npm install …" command.',
        },
        { status: 400 }
      );
    }

    const agentId = body.agentId || 'generic-ai-coding-agent';
    const repository = body.repository || 'workspace/ai-generated-project';
    const targetPolicy = body.targetPolicy || body.targetLicense || 'MIT';

    // Parse requested packages from array or CLI command string
    let rawPackages: string[] = [];
    if (Array.isArray(body.packages)) {
      rawPackages = body.packages.map((p: any) =>
        typeof p === 'string' ? p : p.name ? `${p.name}@${p.version || 'latest'}` : String(p)
      );
    } else if (Array.isArray(body.dependencies)) {
      rawPackages = body.dependencies;
    } else if (typeof body.command === 'string') {
      const tokens = body.command
        .trim()
        .split(/\s+/)
        .filter(
          (tok: string) =>
            tok &&
            !tok.startsWith('-') &&
            !/^(npm|pnpm|yarn|bun|install|i|add|un|uninstall|remove)$/.test(tok)
        );
      rawPackages = tokens;
    }

    if (rawPackages.length === 0) {
      clearSandboxRateLimit(req);
      return NextResponse.json(
        {
          error:
            'No verifiable packages found in request. Provide packages, dependencies, or an npm install command.',
        },
        { status: 400 }
      );
    }

    const boundedPackages = rawPackages.slice(0, MAX_PACKAGES_PER_VERIFY);

    // ── Concurrently evaluate 3 Threat Pillars: License + Hallucination/Typosquat + OSV CVE ──
    const packageEvaluations = await Promise.all(
      boundedPackages.map(async (pkgStr) => {
        const parsedSpec = parsePackageSpecString(pkgStr);
        const pkgName = parsedSpec.name;
        const pkgVersion = parsedSpec.version;

        // Fetch NPM first so 'latest'/versionless requests resolve the effective
        // version from the registry — an unversioned OSV query returns the package's
        // ENTIRE historical vulnerability list and false-blocks already-patched releases.
        const npmRes = await withTimeout(
          fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`, {
            next: { revalidate: 3600 },
          }),
          EXTERNAL_FETCH_TIMEOUT_MS,
          `NPM fetch for ${pkgName}`
        ).then(
          (v) => v,
          () => null
        );

        let npmStatus: number | null = null;
        let npmData: any | null = null;

        if (npmRes) {
          npmStatus = npmRes.status;
          if (npmRes.ok) {
            try {
              npmData = await npmRes.json();
            } catch {
              // fallback
            }
          }
        }

        // Query OSV for the exact version being installed (requested version, or
        // the registry's resolved version when the agent asked for latest).
        const effectiveVersion =
          pkgVersion && pkgVersion !== 'latest' ? pkgVersion : npmData?.version;

        const osvRes = await withTimeout(
          fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              package: { name: pkgName, ecosystem: 'npm' },
              ...(effectiveVersion ? { version: effectiveVersion } : {}),
            }),
            signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
          }),
          EXTERNAL_FETCH_TIMEOUT_MS + 1_000,
          `OSV query for ${pkgName}`
        ).then(
          (v) => v,
          () => null
        );

        let vulnerabilities: any[] = [];
        if (osvRes && osvRes.ok) {
          try {
            const osvData = await osvRes.json();
            vulnerabilities = osvData.vulns || [];
          } catch {
            // fallback
          }
        }

        const inspection = evaluatePackageMetadata(pkgName, pkgVersion, npmStatus, npmData);
        const resolvedLicense = inspection.resolvedLicense;
        const resolvedVersion = inspection.resolvedVersion;

        const isHallucinated = inspection.threatRisks.some((r) => r.type === 'HALLUCINATION');
        const isTyposquat = inspection.threatRisks.some((r) => r.type === 'TYPOSQUATTING');
        const isDeprecated = inspection.threatRisks.some((r) => r.type === 'DEPRECATED');

        const licenseConflict = !isHallucinated
          ? checkLicenseCompatibility(pkgName, resolvedLicense, targetPolicy)
          : null;

        let riskType:
          | 'NONE'
          | 'TYPOSQUATTING_RISK'
          | 'HALLUCINATED_PACKAGE'
          | 'COPYLEFT_VIOLATION'
          | 'CRITICAL_CVE'
          | 'DEPRECATED_PACKAGE'
          | 'UNKNOWN_LICENSE' = 'NONE';
        let itemStatus: 'APPROVED' | 'FLAGGED' = 'APPROVED';
        let conflictDetail: string | null = null;
        let suggestedReplacement: string | null =
          inspection.typosquat.targetPackage || SAFE_REPLACEMENT_MAP[pkgName.toLowerCase()] || null;

        if (isTyposquat) {
          riskType = 'TYPOSQUATTING_RISK';
          itemStatus = 'FLAGGED';
          conflictDetail =
            inspection.threatRisks.find((r) => r.type === 'TYPOSQUATTING')?.detail ||
            'Typosquatting attack detected';
        } else if (isHallucinated) {
          riskType = 'HALLUCINATED_PACKAGE';
          itemStatus = 'FLAGGED';
          conflictDetail =
            inspection.threatRisks.find((r) => r.type === 'HALLUCINATION')?.detail ||
            'Package does not exist on NPM registry (AI hallucination)';
        } else if (licenseConflict && licenseConflict.severity === 'HIGH') {
          riskType = 'COPYLEFT_VIOLATION';
          itemStatus = 'FLAGGED';
          conflictDetail = licenseConflict.detail;
        } else if (vulnerabilities.length > 0) {
          riskType = 'CRITICAL_CVE';
          itemStatus = 'FLAGGED';
          conflictDetail = `${vulnerabilities.length} known OSV security advisories`;
          if (!suggestedReplacement) suggestedReplacement = `${pkgName}@latest`;
        } else if (isDeprecated) {
          riskType = 'DEPRECATED_PACKAGE';
          itemStatus = 'FLAGGED';
          conflictDetail = inspection.deprecatedMessage;
        } else if (licenseConflict) {
          riskType = 'UNKNOWN_LICENSE';
          itemStatus = 'FLAGGED';
          conflictDetail = licenseConflict.detail;
        } else if (resolvedLicense === 'UNKNOWN') {
          riskType = 'UNKNOWN_LICENSE';
          itemStatus = 'FLAGGED';
          conflictDetail = 'License metadata could not be verified';
        }

        return {
          package: pkgName,
          version: resolvedVersion,
          license: resolvedLicense,
          existsOnRegistry: inspection.existsOnRegistry,
          deprecated: inspection.deprecatedMessage,
          suggestedReplacement,
          status: itemStatus,
          riskType,
          vulnerabilitiesCount: vulnerabilities.length,
          vulnerabilities: vulnerabilities.slice(0, 3).map((v) => ({
            id: v.id,
            summary: v.summary || v.details || 'Known vulnerability in package',
          })),
          conflictDetail,
        };
      })
    );

    // ── Score & Overall Verdict Calculation ────────────────────────────────────
    const flaggedItems = packageEvaluations.filter((p) => p.status === 'FLAGGED');
    const totalItems = packageEvaluations.length;

    const hasHardBlockRisk = flaggedItems.some((p) =>
      [
        'TYPOSQUATTING_RISK',
        'HALLUCINATED_PACKAGE',
        'COPYLEFT_VIOLATION',
        'CRITICAL_CVE',
      ].includes(p.riskType)
    );

    let score = 100;
    if (flaggedItems.length > 0) {
      const deductionPerFlag = Math.round(90 / totalItems);
      score = Math.max(15, 100 - flaggedItems.length * deductionPerFlag);
      if (hasHardBlockRisk && score >= 50) {
        score = 25; // Guarantee hard block (< 50) when any critical security/compliance risk exists
      }
    }

    let overallStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (score < 50 || hasHardBlockRisk) {
      overallStatus = 'FAIL';
    } else if (score < 90 || flaggedItems.length > 0) {
      overallStatus = 'WARN';
    }

    // Build A2A Auto-Correction Plan
    const autoCorrection = buildAutoCorrectionPlan(
      packageEvaluations,
      typeof body.command === 'string' ? body.command : undefined
    );

    // ── AI Explanation with Gemini 3.5 Flash ────────────────────────────────────
    let aiExplanation = '';
    let aiRecommendation = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const systemPrompt = `
You are the LicenseShield AI autonomous runtime firewall protecting coding agents from:
1. Legal Traps (viral copyleft licenses like AGPL-3.0, GPL-3.0, SSPL-1.0)
2. AI Hallucinations & Typosquatting (fake 404 packages & typosquats of popular packages)
3. Vulnerabilities & Bloat (OSV CVEs and deprecated libraries)

Evaluate this verification payload from AI Agent "${agentId}" against target policy "${targetPolicy}":
${JSON.stringify(packageEvaluations, null, 2)}

Auto-Correction Plan:
${JSON.stringify(autoCorrection, null, 2)}

Provide a strict JSON response with:
1. "explanation": 2 clear sentences explaining the exact threats or compliance verdict found.
2. "recommendation": Concrete A2A remediation instructions (including exact replacement package names or the remediation command if applicable).
`;

        const geminiRes = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  explanation: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['explanation', 'recommendation'],
              },
            },
          }),
          GEMINI_TIMEOUT_MS,
          'Gemini explanation'
        );

        if (geminiRes.text) {
          const parsed = JSON.parse(geminiRes.text);
          aiExplanation = parsed.explanation;
          aiRecommendation = parsed.recommendation;
        }
      } catch {
        // Fallback rule explanation
      }
    }

    if (!aiExplanation) {
      if (overallStatus === 'FAIL') {
        const riskSummaries = flaggedItems.map(
          (f) => `${f.package} (${f.riskType.replace(/_/g, ' ')})`
        );
        aiExplanation = `Intercepted ${flaggedItems.length} dangerous or non-compliant package(s): ${riskSummaries.join(', ')}. Execution blocked before installation.`;
        aiRecommendation =
          autoCorrection.remediationCommand
            ? `Auto-Correct immediately by running: ${autoCorrection.remediationCommand}`
            : `Remove flagged dependencies (${flaggedItems.map((f) => f.package).join(', ')}) and replace with permissive, verified alternatives.`;
      } else if (overallStatus === 'WARN') {
        aiExplanation = `Dependencies contain deprecation warnings or unverified license metadata under ${targetPolicy} policy.`;
        aiRecommendation =
          autoCorrection.remediationCommand
            ? `Consider modernizing with: ${autoCorrection.remediationCommand}`
            : `Review package metadata manually or pin verified versions.`;
      } else {
        aiExplanation = `All ${totalItems} packages verified authentic on NPM, compliant with ${targetPolicy} policy, and clear of active OSV advisories.`;
        aiRecommendation = `Safe to proceed with agent execution.`;
      }
    }

    // Settle EIP-712 voucher asynchronously if used on verify
    if (authModel === 'ModelB_EIP712_Vault' && verifiedVoucher && signatureHeader) {
      settleEip712Voucher(verifiedVoucher, signatureHeader).catch((err) =>
        console.warn('[Verify] Async EIP-712 settlement warning:', err)
      );
    }

    // ── Generate Cryptographic Execution Proof ────────────────────────────────
    const executionProof = `0x${crypto
      .createHash('sha256')
      .update(`${auditId}:${agentId}:${repository}:${targetPolicy}:${score}:${overallStatus}`)
      .digest('hex')}`;

    const latencyMs = Date.now() - startTime;

    const responsePayload = {
      auditId,
      agentId,
      repository,
      targetPolicy,
      status: overallStatus,
      score,
      executionProof,
      latencyMs,
      authModel,
      details: packageEvaluations,
      autoCorrection,
      explanation: aiExplanation,
      recommendation: aiRecommendation,
      verifiedAt: new Date().toISOString(),
    };

    // Save to Prisma audit logs
    await saveAuditLog({
      auditId,
      userId: authenticatedUserId || null,
      billedVia:
        authModel === 'ModelB_Web3' || authModel === 'ModelB_EIP712_Vault'
          ? 'BASE_SEPOLIA_USDC'
          : 'STRIPE_SUBSCRIPTION',
      targetLicense: targetPolicy,
      packagesScanned: packageEvaluations,
      reportOutput: responsePayload,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[API /v1/verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal verification engine failure' },
      { status: 500 }
    );
  }
}
