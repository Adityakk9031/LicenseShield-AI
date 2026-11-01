import { RiskItem } from './types';

/**
 * Known synthetic/demo package names used in sandbox tests & CLI examples
 * so they deterministically resolve to their intended copyleft license even
 * when not published on registry.npmjs.org.
 */
export function inferSyntheticLicense(pkgName: string): string | null {
  const lower = pkgName.toLowerCase();
  if (lower.includes('agpl')) return 'AGPL-3.0';
  if (lower.includes('sspl')) return 'SSPL-1.0';
  if (lower.includes('lgpl')) return 'LGPL-3.0';
  if (lower.includes('gpl')) return 'GPL-3.0';
  return null;
}

export function checkLicenseCompatibility(
  pkgName: string,
  pkgLicense: string,
  projectLicense: string
): RiskItem | null {
  const proj = (projectLicense || 'MIT').toUpperCase().trim();
  const pkg = (pkgLicense || 'UNKNOWN').toUpperCase().trim();

  if (pkg === 'UNKNOWN' || pkg === 'NONE') {
    return {
      package: pkgName,
      type: 'LICENSE',
      severity: 'MEDIUM',
      detail: 'Package license is unknown or unspecified in registry metadata',
    };
  }

  if (pkg === 'UNLICENSED' || pkg.includes('SEE LICENSE IN') || pkg === 'CUSTOM') {
    return {
      package: pkgName,
      type: 'LICENSE',
      severity: 'HIGH',
      detail: `Non-permissive or custom proprietary license ("${pkgLicense}") conflicts with ${projectLicense} policy`,
    };
  }

  const conflicts: Record<string, string[]> = {
    MIT: [
      'GPL-3.0',
      'GPL-2.0',
      'AGPL-3.0',
      'AGPL-1.0',
      'SSPL-1.0',
      'EUPL',
      'OSL-3.0',
      'CPAL-1.0',
      'CC-BY-NC',
      'CC-BY-SA',
      'PROPRIETARY',
    ],
    'APACHE-2.0': [
      'GPL-2.0',
      'GPL-3.0',
      'AGPL-3.0',
      'AGPL-1.0',
      'SSPL-1.0',
      'CC-BY-NC',
      'CC-BY-SA',
      'PROPRIETARY',
    ],
    'GPL-3.0': ['APACHE-1.1', 'SSPL-1.0', 'CC-BY-NC', 'PROPRIETARY'],
    PROPRIETARY: [
      'GPL-3.0',
      'GPL-2.0',
      'AGPL-3.0',
      'AGPL-1.0',
      'LGPL-3.0',
      'LGPL-2.1',
      'SSPL-1.0',
      'EUPL',
      'OSL-3.0',
      'CPAL-1.0',
      'CC-BY-SA',
    ],
  };

  const projectConflicts = conflicts[proj] || conflicts['MIT'];

  // If it's a compound SPDX expression with OR (e.g. "(MIT OR GPL-3.0)"), check if at least one branch is permissive
  if (pkg.includes(' OR ')) {
    const branches = pkg
      .replace(/[()]/g, '')
      .split(/\s+OR\s+/i)
      .map((b) => b.trim());
    const hasCompatibleBranch = branches.some(
      (branch) => !projectConflicts.some((c) => branch.includes(c))
    );
    if (hasCompatibleBranch) {
      return null;
    }
  }

  const matchedConflict = projectConflicts.find((conflictLicense) =>
    pkg.includes(conflictLicense)
  );

  if (matchedConflict) {
    return {
      package: pkgName,
      type: 'LICENSE',
      severity: 'HIGH',
      detail: `Viral/restrictive license ${pkgLicense} (${matchedConflict}) conflicts with ${projectLicense} target policy`,
    };
  }

  return null;
}
