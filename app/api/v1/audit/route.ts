import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { checkLicenseCompatibility } from '@/lib/license-engine';
import { verifyApiKey, verifyEscrowLock, settleEscrowPayment, saveAuditLog } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    // ── 1. Hybrid Auth & Payment Verification ────────────────────────────────
    const authHeader = req.headers.get('Authorization') || '';
    const auditIdHeader = req.headers.get('X-Audit-ID') || req.headers.get('X-Payment-Signature') || '';

    let isAuthorized = false;
    let authModel: 'ModelA_SaaS' | 'ModelB_Web3' | null = null;
    let authenticatedUserId: string | undefined = undefined;

    // Check Model A (Web2 SaaS Bearer API Key via Supabase & env)
    if (authHeader) {
      const authRes = await verifyApiKey(authHeader);
      if (authRes.authorized) {
        isAuthorized = true;
        authModel = 'ModelA_SaaS';
        authenticatedUserId = authRes.userId;
      }
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const auditId = auditIdHeader || body.auditId || body.orderId || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check Model B (Web3 Micro-API Escrow Lock) if not authorized via API key
    if (!isAuthorized && auditId) {
      const isLocked = await verifyEscrowLock(auditId);
      if (isLocked) {
        isAuthorized = true;
        authModel = 'ModelB_Web3';
      }
    }

    // Challenge Mode: HTTP 402 Payment Required
    if (!isAuthorized) {
      const escrowContract = process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
      return NextResponse.json(
        {
          status: 402,
          error: 'Payment Required',
          message: 'Valid Web2 API key or Web3 $0.01 USDC escrow lock required.',
          paymentInstructions: {
            amount: '0.01',
            token: 'USDC',
            network: 'eip155:84532',
            contractAddress: escrowContract,
            lockFunction: 'lockAuditFee(bytes32 auditId, bytes32 payloadHash)',
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

    // ── 3. Concurrent NPM License & OSV CVE Data Fetching ────────────────────
    const auditResults = await Promise.all(
      rawDependencies.map(async (dep) => {
        let packageName = typeof dep === 'string' ? dep : dep.name;
        let packageVersion = typeof dep === 'object' ? dep.version : undefined;

        if (typeof dep === 'string') {
          const atIdx = dep.lastIndexOf('@');
          if (atIdx > 0) {
            packageName = dep.slice(0, atIdx);
            packageVersion = dep.slice(atIdx + 1);
          }
        }

        const [npmRes, osvRes] = await Promise.allSettled([
          fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`),
          fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              package: { name: packageName, ecosystem: 'npm' },
              ...(packageVersion ? { version: packageVersion } : {}),
            }),
          }),
        ]);

        let resolvedLicense = 'UNKNOWN';
        let resolvedVersion = packageVersion;

        if (npmRes.status === 'fulfilled' && npmRes.value.ok) {
          try {
            const npmData = await npmRes.value.json();
            resolvedLicense = npmData.license || 'UNKNOWN';
            if (!resolvedVersion) resolvedVersion = npmData.version;
          } catch (e) {
            console.error(`Error parsing NPM response for ${packageName}:`, e);
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

        return {
          name: packageName,
          version: resolvedVersion,
          license: resolvedLicense,
          vulnerabilities,
        };
      })
    );

    // ── 4. AI Audit Analysis (Gemini 3.5 Flash) ──────────────────────────────
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
You are an enterprise dependency security and license compliance agent for LicenseShield AI.
Analyze the following dependencies for open-source license conflicts and known security vulnerabilities against the project's target license.

Target License Policy: ${targetLicense}

Dependencies to analyze (with resolved license and OSV vulnerability data):
${JSON.stringify(auditResults, null, 2)}

Instructions:
1. Evaluate whether each package's license conflicts with ${targetLicense} (e.g., AGPL-3.0, GPL-3.0 violates MIT or Proprietary target licenses).
2. Assess the severity and presence of security vulnerabilities from the OSV data.
3. Set status to FLAGGED if any license conflicts or medium/high/critical CVE risks exist. Otherwise APPROVED.
4. Provide a clear, detailed 2-sentence reason explaining the exact license conflict or security vulnerability risk context.
5. Provide actionable npm alternatives if FLAGGED.
6. Return output strictly matching the JSON schema.
`;

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: {
                  type: Type.STRING,
                  enum: ['APPROVED', 'FLAGGED'],
                  description: 'FLAGGED if any license conflicts or vulnerability risks exist, otherwise APPROVED.',
                },
                reason: {
                  type: Type.STRING,
                  description: 'Clear string explaining the exact license conflict or security vulnerability risk context.',
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
        });

        if (geminiResponse.text) {
          parsedVerdict = JSON.parse(geminiResponse.text);
        }
      } catch (geminiError) {
        console.error('Gemini AI audit failed, falling back to rule-based engine:', geminiError);
      }
    }

    // ── 5. Fallback Rule-Based Compliance Engine ─────────────────────────────
    const risks: any[] = [];
    const suggestions: string[] = [];

    if (!parsedVerdict) {
      auditResults.forEach((pkg) => {
        const conflict = checkLicenseCompatibility(pkg.name, pkg.license, targetLicense);
        if (conflict) {
          risks.push(conflict);
          suggestions.push(
            conflict.severity === 'HIGH'
              ? `Replace ${pkg.name} with a ${targetLicense}-compatible alternative (current: ${pkg.license}).`
              : `Review license terms for ${pkg.name} (${pkg.license}).`
          );
        }

        if (pkg.vulnerabilities.length > 0) {
          risks.push({
            package: pkg.name,
            type: 'VULNERABILITY',
            severity: 'HIGH',
            detail: `${pkg.vulnerabilities.length} known vulnerabilities (e.g. ${pkg.vulnerabilities[0].id})`,
          });
          suggestions.push(`Upgrade or replace ${pkg.name} to address ${pkg.vulnerabilities.length} known CVEs.`);
        }
      });

      const status = risks.some((r) => r.severity === 'HIGH') ? 'FLAGGED' : 'APPROVED';
      parsedVerdict = {
        status,
        reason:
          status === 'FLAGGED'
            ? `Audit flagged due to copyleft conflicts or active vulnerabilities in: ${risks.map((r) => r.package).join(', ')}.`
            : 'All dependency licenses and vulnerability checks completed successfully.',
        suggestedAlternatives: Array.from(new Set(suggestions)),
      };
    } else {
      auditResults.forEach((pkg) => {
        const conflict = checkLicenseCompatibility(pkg.name, pkg.license, targetLicense);
        if (conflict) risks.push(conflict);

        if (pkg.vulnerabilities.length > 0) {
          risks.push({
            package: pkg.name,
            type: 'VULNERABILITY',
            severity: 'HIGH',
            detail: `${pkg.vulnerabilities.length} known vulnerabilities (e.g. ${pkg.vulnerabilities[0].id})`,
          });
        }
      });
    }

    // ── 6. Web3 On-Chain Settlement ──────────────────────────────────────────
    let settlementTxHash: string | null = null;
    if (authModel === 'ModelB_Web3' && auditId) {
      settlementTxHash = await settleEscrowPayment(auditId);
    }

    // ── 7. Construct Final Response Payload & Save Audit Log ──────────────────
    const reportPayload = {
      auditId,
      status: parsedVerdict.status,
      reason: parsedVerdict.reason,
      suggestedAlternatives: parsedVerdict.suggestedAlternatives,
      risks,
      suggestions: parsedVerdict.suggestedAlternatives,
      aiAnalysis: parsedVerdict.reason,
      authModel,
      settlementTxHash,
      scannedAt: new Date().toISOString(),
    };

    // Save full audit history to Supabase `audit_logs` table
    await saveAuditLog({
      auditId,
      userId: authenticatedUserId || null,
      billedVia: authModel === 'ModelB_Web3' ? 'BASE_SEPOLIA_USDC' : 'STRIPE_SUBSCRIPTION',
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
