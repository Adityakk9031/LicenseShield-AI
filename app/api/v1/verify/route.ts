import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { checkLicenseCompatibility } from '@/lib/license-engine';
import { verifyApiKey, verifyEscrowLock, saveAuditLog } from '@/lib/payment';

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const auditIdHeader = req.headers.get('X-Audit-ID') || req.headers.get('X-Payment-Signature') || '';

    let isAuthorized = false;
    let authModel: 'ModelA_SaaS' | 'ModelB_Web3' | 'Sandbox_Guest' = 'Sandbox_Guest';
    let authenticatedUserId: string | undefined = undefined;

    // Check Model A (Bearer API Key)
    if (authHeader) {
      const authRes = await verifyApiKey(authHeader);
      if (authRes.authorized) {
        isAuthorized = true;
        authModel = 'ModelA_SaaS';
        authenticatedUserId = authRes.userId;
      }
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const auditId = auditIdHeader || body.auditId || `vfy_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Check Model B (Web3 Escrow Lock)
    if (!isAuthorized && auditIdHeader) {
      const isLocked = await verifyEscrowLock(auditId);
      if (isLocked) {
        isAuthorized = true;
        authModel = 'ModelB_Web3';
      }
    }

    // If sandbox / public guest execution, allow execution in sandbox mode
    if (!isAuthorized) {
      isAuthorized = true;
      authModel = 'Sandbox_Guest';
    }

    const agentId = body.agentId || 'generic-ai-coding-agent';
    const repository = body.repository || 'workspace/ai-generated-project';
    const targetPolicy = body.targetPolicy || body.targetLicense || 'MIT';

    // Parse requested packages
    let rawPackages: string[] = [];
    if (Array.isArray(body.packages)) {
      rawPackages = body.packages.map((p: any) => (typeof p === 'string' ? p : p.name ? `${p.name}@${p.version || 'latest'}` : String(p)));
    } else if (Array.isArray(body.dependencies)) {
      rawPackages = body.dependencies;
    } else if (typeof body.command === 'string' && body.command.includes('npm install')) {
      const parts = body.command.replace('npm install', '').replace('npm i', '').trim().split(/\s+/);
      rawPackages = parts.filter((p: string) => p && !p.startsWith('-'));
    }

    if (rawPackages.length === 0) {
      rawPackages = ['axios@1.6.0', 'lodash@4.17.20'];
    }

    // ── Concurrently fetch NPM metadata & OSV.dev CVEs ─────────────────────────
    const packageEvaluations = await Promise.all(
      rawPackages.map(async (pkgStr) => {
        let pkgName = pkgStr;
        let pkgVersion: string | undefined = undefined;

        const atIdx = pkgStr.lastIndexOf('@');
        if (atIdx > 0) {
          pkgName = pkgStr.slice(0, atIdx);
          pkgVersion = pkgStr.slice(atIdx + 1);
        }

        const [npmRes, osvRes] = await Promise.allSettled([
          fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`, { next: { revalidate: 3600 } }),
          fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              package: { name: pkgName, ecosystem: 'npm' },
              ...(pkgVersion && pkgVersion !== 'latest' ? { version: pkgVersion } : {}),
            }),
          }),
        ]);

        let resolvedLicense = 'UNKNOWN';
        let resolvedVersion = pkgVersion || 'latest';

        if (npmRes.status === 'fulfilled' && npmRes.value.ok) {
          try {
            const npmData = await npmRes.value.json();
            resolvedLicense = npmData.license || 'UNKNOWN';
            if (!pkgVersion || pkgVersion === 'latest') resolvedVersion = npmData.version || 'latest';
          } catch {
            // fallback
          }
        }

        let vulnerabilities: any[] = [];
        if (osvRes.status === 'fulfilled' && osvRes.value.ok) {
          try {
            const osvData = await osvRes.value.json();
            vulnerabilities = osvData.vulns || [];
          } catch {
            // fallback
          }
        }

        const licenseConflict = checkLicenseCompatibility(pkgName, resolvedLicense, targetPolicy);

        let riskType: 'NONE' | 'COPYLEFT_VIOLATION' | 'CRITICAL_CVE' | 'UNKNOWN_LICENSE' = 'NONE';
        let itemStatus: 'APPROVED' | 'FLAGGED' = 'APPROVED';

        if (licenseConflict) {
          riskType = 'COPYLEFT_VIOLATION';
          itemStatus = 'FLAGGED';
        } else if (vulnerabilities.length > 0) {
          riskType = 'CRITICAL_CVE';
          itemStatus = 'FLAGGED';
        } else if (resolvedLicense === 'UNKNOWN') {
          riskType = 'UNKNOWN_LICENSE';
          itemStatus = 'FLAGGED';
        }

        return {
          package: pkgName,
          version: resolvedVersion,
          license: resolvedLicense,
          status: itemStatus,
          riskType,
          vulnerabilitiesCount: vulnerabilities.length,
          vulnerabilities: vulnerabilities.slice(0, 3).map((v) => ({
            id: v.id,
            summary: v.summary || v.details || 'Known vulnerability in package',
          })),
          conflictDetail: licenseConflict ? licenseConflict.detail : null,
        };
      })
    );

    // ── Score & Overall Verdict Calculation ────────────────────────────────────
    const flaggedItems = packageEvaluations.filter((p) => p.status === 'FLAGGED');
    const totalItems = packageEvaluations.length;

    let score = 100;
    if (flaggedItems.length > 0) {
      const deductionPerFlag = Math.round(90 / totalItems);
      score = Math.max(15, 100 - flaggedItems.length * deductionPerFlag);
    }

    let overallStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (score < 50) {
      overallStatus = 'FAIL';
    } else if (score < 90) {
      overallStatus = 'WARN';
    }

    // ── AI Explanation with Gemini 2.5 Flash ────────────────────────────────────
    let aiExplanation = '';
    let aiRecommendation = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const systemPrompt = `
You are the LicenseShield AI autonomous verification agent protecting repositories from unauthorized AI code generation dependencies.
Evaluate this dependency verification payload from AI Agent "${agentId}" against target policy "${targetPolicy}":
${JSON.stringify(packageEvaluations, null, 2)}

Provide a strict JSON response with:
1. "explanation": 2 clear sentences explaining the verification verdict and security/license impact.
2. "recommendation": Concrete fix instructions or compatible replacement packages if any issues exist.
`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
        });

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
        aiExplanation = `Intercepted ${flaggedItems.length} incompatible or vulnerable packages violating the ${targetPolicy} policy. Execution blocked to prevent license infection.`;
        aiRecommendation = `Replace flagged dependencies (${flaggedItems.map((f) => f.package).join(', ')}) with permissive alternatives like lodash-es or clean modular libraries.`;
      } else if (overallStatus === 'WARN') {
        aiExplanation = `Dependencies contain minor warnings or unknown license definitions under ${targetPolicy} policy.`;
        aiRecommendation = `Review package licenses manually or specify strict pinned versions.`;
      } else {
        aiExplanation = `All ${totalItems} packages verified compliant with ${targetPolicy} policy and clear of active OSV advisories.`;
        aiRecommendation = `Safe to proceed with agent code execution.`;
      }
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
      explanation: aiExplanation,
      recommendation: aiRecommendation,
      verifiedAt: new Date().toISOString(),
    };

    // Save to Prisma audit logs
    await saveAuditLog({
      auditId,
      userId: authenticatedUserId || null,
      billedVia: authModel === 'ModelB_Web3' ? 'BASE_SEPOLIA_USDC' : 'STRIPE_SUBSCRIPTION',
      targetLicense: targetPolicy,
      packagesScanned: packageEvaluations,
      reportOutput: responsePayload,
    });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Agent verify API handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal verification error' },
      { status: 500 }
    );
  }
}
