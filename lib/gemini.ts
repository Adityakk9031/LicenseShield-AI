import { GoogleGenAI, Type } from '@google/genai';
import { RiskItem } from './types';

export interface AIOptimizedVerdict {
  status: 'APPROVED' | 'FLAGGED';
  risks: RiskItem[];
  suggestions: string[];
  aiAnalysis: string;
}

export async function runAIAudit(
  projectLicense: string,
  packages: Array<{ name: string; version?: string; license: string; vulnerabilities: any[] }>
): Promise<AIOptimizedVerdict | null> {
  // Read at request-time so the env var is always fresh (avoids build-time init issues)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[LicenseShield] GEMINI_API_KEY not set — falling back to rule-based engine.');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a dependency security and license compliance agent for LicenseShield AI.
Analyze the following dependencies for license conflicts and known vulnerabilities against the project's declared license policy.

Project License Policy: ${projectLicense}

Dependencies to analyze (with resolved license and OSV vulnerability data):
${JSON.stringify(packages, null, 2)}

Instructions:
1. Identify all license conflicts. MIT/Apache projects conflict with strong copyleft (GPL-3.0, AGPL-3.0). Proprietary projects conflict with any copyleft license.
2. Assess vulnerability data from the OSV results. Determine severity (HIGH, MEDIUM, LOW) based on impact.
3. Formulate specific, actionable remediation suggestions per issue found.
4. Provide a premium, expert 2-sentence summary as 'aiAnalysis' explaining the overall audit risk level.
5. Return output strictly as JSON matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: ['APPROVED', 'FLAGGED'],
              description: 'FLAGGED if any HIGH severity risks exist, otherwise APPROVED.',
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  package: { type: Type.STRING, description: 'Package name' },
                  type: { type: Type.STRING, enum: ['LICENSE', 'VULNERABILITY'] },
                  severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                  detail: { type: Type.STRING, description: 'Human-readable explanation of the risk' },
                },
                required: ['package', 'type', 'severity', 'detail'],
              },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable, deduplicated remediation steps.',
            },
            aiAnalysis: {
              type: Type.STRING,
              description: 'A concise expert summary of the audit findings (2 sentences max).',
            },
          },
          required: ['status', 'risks', 'suggestions', 'aiAnalysis'],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIOptimizedVerdict;
    }
    return null;
  } catch (error) {
    console.error('[LicenseShield] Gemini AI Audit failed:', error);
    return null;
  }
}
