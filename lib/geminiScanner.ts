/**
 * LicenseShield AI — Gemini Scanner Sub-Module
 *
 * Two dedicated functions for the two distinct AI parsing tasks:
 *
 *  1. parseLicenseText()   — Takes raw/ambiguous license text and returns a
 *                            structured APPROVED/FLAGGED verdict with reason
 *                            and suggested package alternatives.
 *
 *  2. analyzeVulnerabilities() — Takes an OSV vulnerability array for a single
 *                                package and returns a severity-contextualized
 *                                structured verdict.
 *
 * Both functions enforce `responseMimeType: "application/json"` with a strict
 * responseSchema so Gemini 2.5 Flash always returns machine-parseable output.
 */

import { GoogleGenAI, Type } from '@google/genai';

// ─── Output Schema ─────────────────────────────────────────────────────────────

/**
 * Canonical scanner output — identical schema for both sub-functions.
 * This is what the checklist requires and what CROO deliverables carry.
 */
export interface ScannerVerdict {
  status: 'APPROVED' | 'FLAGGED';
  reason: string;
  suggestedAlternatives: string[];
}

// ─── Shared schema definition (reused by both calls) ──────────────────────────

const VERDICT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ['APPROVED', 'FLAGGED'],
      description:
        'FLAGGED if the license text is incompatible, ambiguous, or the vulnerability is HIGH severity. APPROVED otherwise.',
    },
    reason: {
      type: Type.STRING,
      description:
        'Clear, expert 1-2 sentence explanation of the license conflict or vulnerability severity.',
    },
    suggestedAlternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Zero or more drop-in npm package alternatives that resolve the flagged issue.',
    },
  },
  required: ['status', 'reason', 'suggestedAlternatives'],
};

function buildClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[geminiScanner] GEMINI_API_KEY is not set. Cannot invoke Gemini 2.5 Flash.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

// ─── parseLicenseText ─────────────────────────────────────────────────────────

/**
 * parseLicenseText
 *
 * Feed a raw or ambiguous license string (e.g. a custom EULA, non-SPDX text,
 * or a compound expression like "MIT OR GPL-3.0") to Gemini 2.5 Flash for
 * semantic analysis against a target project license.
 *
 * @param rawLicenseText   The raw license text or SPDX expression to analyse.
 * @param projectLicense   The project's declared license (e.g. "MIT").
 * @param packageName      The package name for richer context.
 */
export async function parseLicenseText(
  rawLicenseText: string,
  projectLicense: string,
  packageName: string
): Promise<ScannerVerdict> {
  const ai = buildClient();

  const prompt = `
You are an expert open-source license compliance attorney for LicenseShield AI.

A software project licensed under "${projectLicense}" is considering using the package "${packageName}".
That package carries the following raw license text or SPDX expression:

---
${rawLicenseText}
---

Your task:
1. Identify whether this license is SPDX-standard, a custom license, or ambiguous.
2. Determine if it is compatible with "${projectLicense}" projects. Pay close attention to:
   - Copyleft obligations (GPL-2.0, GPL-3.0, AGPL-3.0, LGPL → conflict with proprietary/MIT/Apache)
   - Non-commercial restrictions
   - Attribution clauses that may be burdensome
   - Viral licensing clauses
3. If FLAGGED, suggest 2–3 well-known npm drop-in alternatives that are "${projectLicense}"-compatible.
4. Return output strictly matching the provided JSON schema.
`.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: VERDICT_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error('[geminiScanner] parseLicenseText: empty response from Gemini.');
  }
  return JSON.parse(response.text) as ScannerVerdict;
}

// ─── analyzeVulnerabilities ───────────────────────────────────────────────────

export interface OsvVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: { type: string; score: string }[];
  aliases?: string[];
  published?: string;
}

/**
 * analyzeVulnerabilities
 *
 * Takes a batch of OSV vulnerability objects for a single package and asks
 * Gemini 2.5 Flash to contextualize their combined risk, determine the overall
 * severity, and suggest concrete remediation.
 *
 * @param packageName     The affected npm package name.
 * @param version         The installed version.
 * @param vulnerabilities Array of OSV vulnerability records.
 * @param projectContext  Short description of how the project uses this package.
 */
export async function analyzeVulnerabilities(
  packageName: string,
  version: string,
  vulnerabilities: OsvVulnerability[],
  projectContext = 'general Node.js application'
): Promise<ScannerVerdict> {
  const ai = buildClient();

  if (vulnerabilities.length === 0) {
    return {
      status: 'APPROVED',
      reason: `No known vulnerabilities found for ${packageName}@${version}.`,
      suggestedAlternatives: [],
    };
  }

  const vulnSummary = vulnerabilities
    .slice(0, 10) // cap to avoid exceeding context window
    .map(
      (v, i) =>
        `${i + 1}. ${v.id}${v.aliases?.length ? ` (aliases: ${v.aliases.join(', ')})` : ''}
   Summary: ${v.summary ?? 'N/A'}
   CVSS/Severity: ${v.severity?.map((s) => `${s.type}=${s.score}`).join(', ') ?? 'Not specified'}
   Published: ${v.published ?? 'Unknown'}`
    )
    .join('\n\n');

  const prompt = `
You are a senior application security engineer at LicenseShield AI.

The package "${packageName}@${version}" used in a "${projectContext}" has ${vulnerabilities.length} known OSV vulnerabilities:

${vulnSummary}

Your task:
1. Assess the combined risk of these vulnerabilities for the described project context.
2. Set status to FLAGGED if ANY vulnerability is HIGH or CRITICAL severity, or if there is a known exploit in the wild.
3. Set status to APPROVED only if ALL vulnerabilities are LOW severity with no known exploits.
4. Provide a clear, expert reason explaining the dominant risk.
5. Suggest 2–3 well-maintained, actively-patched npm alternatives if FLAGGED.
6. Return output strictly matching the provided JSON schema.
`.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: VERDICT_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error('[geminiScanner] analyzeVulnerabilities: empty response from Gemini.');
  }
  return JSON.parse(response.text) as ScannerVerdict;
}
