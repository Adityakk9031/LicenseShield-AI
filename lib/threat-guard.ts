import { AutoCorrectionPlan, RiskItem } from './types';
import { inferSyntheticLicense } from './license-engine';

/**
 * Curated list of top high-value NPM packages targeted by typosquatting
 * and LLM hallucination slopsquatting attacks.
 */
const POPULAR_NPM_PACKAGES = [
  'react',
  'react-dom',
  'next',
  'vue',
  'svelte',
  'angular',
  'express',
  'fastify',
  'koa',
  'hono',
  'axios',
  'node-fetch',
  'undici',
  'got',
  'ky',
  'lodash',
  'lodash-es',
  'underscore',
  'ramda',
  'chalk',
  'picocolors',
  'kleur',
  'commander',
  'yargs',
  'inquirer',
  'dotenv',
  'cross-env',
  'zod',
  'yup',
  'joi',
  'ajv',
  'prisma',
  '@prisma/client',
  'drizzle-orm',
  'typeorm',
  'sequelize',
  'mongoose',
  'pg',
  'mysql2',
  'redis',
  'ioredis',
  'bullmq',
  'stripe',
  'openai',
  '@anthropic-ai/sdk',
  '@google/genai',
  'langchain',
  'ai',
  'ethers',
  'viem',
  'wagmi',
  'web3',
  'hardhat',
  'solc',
  'typescript',
  'ts-node',
  'tsx',
  'vite',
  'webpack',
  'esbuild',
  'rollup',
  'tailwindcss',
  'postcss',
  'autoprefixer',
  'framer-motion',
  'gsap',
  'three',
  'lucide-react',
  'clsx',
  'tailwind-merge',
  'jsonwebtoken',
  'jose',
  'bcrypt',
  'bcryptjs',
  'argon2',
  'passport',
  'uuid',
  'nanoid',
  'moment',
  'dayjs',
  'date-fns',
  'luxon',
  'rxjs',
  'zustand',
  'redux',
  '@reduxjs/toolkit',
  'tanstack-query',
  '@tanstack/react-query',
  'swr',
  'cheerio',
  'puppeteer',
  'playwright',
  'ws',
  'socket.io',
  'cors',
  'helmet',
  'morgan',
  'winston',
  'pino',
  'nodemailer',
  'resend',
  'sharp',
  'multer',
  'fs-extra',
  'glob',
  'minimatch',
  'semver',
  'debug',
  'ms',
];

/**
 * Known deprecated/vulnerable/legacy packages mapped to modern, safe drop-in replacements.
 */
export const SAFE_REPLACEMENT_MAP: Record<string, string> = {
  request: 'axios',
  'request-promise': 'axios',
  'request-promise-native': 'axios',
  moment: 'dayjs',
  'node-sass': 'sass',
  tslint: 'eslint',
  'left-pad': 'lodash-es',
  querystring: 'qs',
  'uuid-v4': 'uuid',
  'crypto-js': 'jose',
  colors: 'picocolors',
  faker: '@faker-js/faker',
  minimist: 'yargs-parser',
  'agpl-3.0-module': 'zod',
  'some-gpl-package': 'lodash-es',
};

/**
 * Cleanly parses package spec strings like:
 *   "axios@1.6.0" -> { name: "axios", version: "1.6.0" }
 *   "@prisma/client@5.22.0" -> { name: "@prisma/client", version: "5.22.0" }
 *   "@prisma/client" -> { name: "@prisma/client", version: undefined }
 */
export function parsePackageSpecString(input: string | { name: string; version?: string }): {
  name: string;
  version?: string;
} {
  if (typeof input !== 'string') {
    return { name: String(input.name || '').trim(), version: input.version };
  }
  const trimmed = input.trim();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx > 0) {
    return {
      name: trimmed.slice(0, atIdx),
      version: trimmed.slice(atIdx + 1) || undefined,
    };
  }
  return { name: trimmed };
}

/**
 * Optimal String Alignment (Damerau-Levenshtein) distance.
 * Counts insertions, deletions, substitutions, and adjacent transpositions (e.g. "axois" -> "axios" = 1).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost); // transposition
      }
    }
  }

  return dp[lenA][lenB];
}

export interface TyposquatResult {
  isTyposquat: boolean;
  targetPackage?: string;
  distance?: number;
  reason?: string;
}

/**
 * Checks if `pkgName` is a probable typosquat of a popular NPM package.
 */
export function detectTyposquatting(pkgName: string): TyposquatResult {
  const normalized = pkgName.toLowerCase().trim();

  // If it IS an exact match for a known popular package, it's safe.
  if (POPULAR_NPM_PACKAGES.includes(normalized)) {
    return { isTyposquat: false };
  }

  // Ignore synthetic copyleft demo fixtures
  if (inferSyntheticLicense(normalized)) {
    return { isTyposquat: false };
  }

  const strippedInput = normalized.replace(/[-_.]/g, '');

  for (const popular of POPULAR_NPM_PACKAGES) {
    // Skip very short 2-char package names ('ws', 'pg', 'ms', 'ai', 'ky') to avoid false positives
    if (popular.length <= 3) continue;

    // 1. Delimiter confusion (e.g., "reactdom" vs "react-dom", "lodashes" vs "lodash-es", "datefns" vs "date-fns")
    const strippedPopular = popular.replace(/[-_./@]/g, '');
    if (strippedInput === strippedPopular && normalized !== popular) {
      return {
        isTyposquat: true,
        targetPackage: popular,
        distance: 1,
        reason: `Delimiter/namespace confusion against popular package "${popular}"`,
      };
    }

    // 2. Suffix/prefix bait (e.g. "axios-js", "express-js", "ethersjs", "nextjs")
    if (
      normalized === `${popular}js` ||
      normalized === `${popular}-js` ||
      normalized === `node-${popular}`
    ) {
      // Note: "node-fetch" is in POPULAR_NPM_PACKAGES so it returned early above
      return {
        isTyposquat: true,
        targetPackage: popular,
        distance: 2,
        reason: `Suspicious suffix/prefix variant of popular package "${popular}"`,
      };
    }

    // 3. Damerau-Levenshtein distance (1 edit or transposition for length >= 4; up to 2 for length >= 8)
    const dist = damerauLevenshtein(normalized, popular);
    const maxAllowedDist = popular.length >= 8 ? 2 : 1;

    if (dist > 0 && dist <= maxAllowedDist && Math.abs(normalized.length - popular.length) <= 2) {
      return {
        isTyposquat: true,
        targetPackage: popular,
        distance: dist,
        reason: `Name is ${dist} edit(s)/transposition away from top ecosystem package "${popular}" (typosquatting risk)`,
      };
    }
  }

  return { isTyposquat: false };
}

export interface NpmMetadataInspection {
  existsOnRegistry: boolean;
  resolvedVersion: string;
  resolvedLicense: string;
  deprecatedMessage: string | null;
  typosquat: TyposquatResult;
  threatRisks: RiskItem[];
}

/**
 * Evaluates a package's NPM registry response + name for:
 *  - AI Hallucinations (404 Not Found on NPM Registry -> Slopsquatting risk)
 *  - Typosquatting (Edit-distance / transposition match against top packages)
 *  - Deprecation / Unmaintained status (`deprecated` field in registry metadata)
 */
export function evaluatePackageMetadata(
  pkgName: string,
  requestedVersion: string | undefined,
  npmStatus: number | null,
  npmData: any | null
): NpmMetadataInspection {
  const threatRisks: RiskItem[] = [];
  const typosquat = detectTyposquatting(pkgName);
  const syntheticLicense = inferSyntheticLicense(pkgName);

  // 1. Check Typosquatting first
  if (typosquat.isTyposquat && typosquat.targetPackage) {
    threatRisks.push({
      package: pkgName,
      type: 'TYPOSQUATTING',
      severity: 'HIGH',
      detail: `${typosquat.reason}. High risk of supply-chain malware injection.`,
      suggestedReplacement: typosquat.targetPackage,
    });
  }

  // 2. Check if package exists on NPM registry (HTTP 404 = AI Hallucination / Slopsquatting target)
  const existsOnRegistry = npmStatus === 200 && npmData !== null;

  if (npmStatus === 404 && !syntheticLicense) {
    threatRisks.push({
      package: pkgName,
      type: 'HALLUCINATION',
      severity: 'HIGH',
      detail: `Package "${pkgName}" does not exist on the NPM registry (HTTP 404). Likely an AI hallucination vulnerable to slopsquatting attacks.`,
      suggestedReplacement: typosquat.targetPackage || SAFE_REPLACEMENT_MAP[pkgName.toLowerCase()],
    });
  }

  // 3. Check Deprecated status
  const deprecatedMessage =
    npmData && typeof npmData.deprecated === 'string' && npmData.deprecated.trim().length > 0
      ? npmData.deprecated.trim()
      : null;

  if (deprecatedMessage) {
    const replacement = SAFE_REPLACEMENT_MAP[pkgName.toLowerCase()];
    threatRisks.push({
      package: pkgName,
      type: 'DEPRECATED',
      severity: 'MEDIUM',
      detail: `Deprecated & unmaintained library: "${deprecatedMessage}"`,
      suggestedReplacement: replacement,
    });
  }

  // Resolve license & version
  let resolvedLicense = 'UNKNOWN';
  if (syntheticLicense) {
    resolvedLicense = syntheticLicense;
  } else if (npmData?.license) {
    resolvedLicense =
      typeof npmData.license === 'string'
        ? npmData.license
        : npmData.license.type || 'UNKNOWN';
  }

  const resolvedVersion =
    requestedVersion && requestedVersion !== 'latest'
      ? requestedVersion
      : npmData?.version || requestedVersion || 'latest';

  return {
    existsOnRegistry: existsOnRegistry || Boolean(syntheticLicense),
    resolvedVersion,
    resolvedLicense,
    deprecatedMessage,
    typosquat,
    threatRisks,
  };
}

/**
 * Generates a deterministic Agent-to-Agent (A2A) Auto-Correction Plan so
 * an autonomous coding agent (Cursor, Claude Code, Gemini CLI) can immediately
 * self-correct its install command without human intervention.
 */
export function buildAutoCorrectionPlan(
  packages: Array<{
    package: string;
    version: string;
    status: 'APPROVED' | 'FLAGGED';
    riskType: string;
    suggestedReplacement?: string | null;
  }>,
  originalCommand?: string
): AutoCorrectionPlan {
  const blockedPackages: string[] = [];
  const replacements: Record<string, string> = {};
  const finalInstallList: string[] = [];

  // Package manager prefix detection
  let pmPrefix = 'npm install';
  if (originalCommand) {
    const match = originalCommand.trim().match(/^(npm|pnpm|yarn|bun)\s+(install|i|add)\b/);
    if (match) {
      pmPrefix = `${match[1]} ${match[2]}`;
    }
  }

  for (const item of packages) {
    if (item.status === 'APPROVED') {
      finalInstallList.push(
        item.version && item.version !== 'latest'
          ? `${item.package}@${item.version}`
          : item.package
      );
      continue;
    }

    blockedPackages.push(
      item.version && item.version !== 'latest'
        ? `${item.package}@${item.version}`
        : item.package
    );

    const mappedReplacement =
      item.suggestedReplacement ||
      SAFE_REPLACEMENT_MAP[item.package.toLowerCase()] ||
      (item.riskType === 'CRITICAL_CVE' ? `${item.package}@latest` : null);

    if (mappedReplacement) {
      replacements[item.package] = mappedReplacement;
      finalInstallList.push(mappedReplacement);
    }
  }

  const uniqueInstallList = Array.from(new Set(finalInstallList));
  const canAutoFix = blockedPackages.length > 0 && uniqueInstallList.length > 0;
  const remediationCommand =
    blockedPackages.length === 0
      ? null
      : uniqueInstallList.length > 0
        ? `${pmPrefix} ${uniqueInstallList.join(' ')}`
        : null;

  const agentInstruction =
    blockedPackages.length === 0
      ? 'All packages passed security, hallucination, and license checks. Proceed with installation.'
      : canAutoFix
        ? `A2A AUTO-CORRECTION: Blocked [${blockedPackages.join(', ')}]. Pivot immediately and execute: \`${remediationCommand}\``
        : `A2A BLOCK: Remove [${blockedPackages.join(', ')}] and select a permissive, actively maintained alternative.`;

  return {
    canAutoFix,
    blockedPackages,
    replacements,
    remediationCommand,
    agentInstruction,
  };
}
