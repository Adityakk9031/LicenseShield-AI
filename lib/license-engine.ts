import { RiskItem } from './types';

export function checkLicenseCompatibility(
  pkgName: string,
  pkgLicense: string,
  projectLicense: string
): RiskItem | null {
  const proj = projectLicense.toUpperCase();
  const pkg = pkgLicense.toUpperCase();
  
  if (pkg === 'UNKNOWN') {
    return {
      package: pkgName,
      type: 'LICENSE',
      severity: 'MEDIUM',
      detail: 'Package license is unknown'
    };
  }
  
  const conflicts: Record<string, string[]> = {
    'MIT': ['GPL-3.0', 'AGPL-3.0', 'GPL-2.0'],
    'APACHE-2.0': ['GPL-2.0', 'AGPL-3.0'],
    'GPL-3.0': ['APACHE-1.1', 'PROPRIETARY'],
    'PROPRIETARY': ['GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0', 'LGPL-2.1']
  };

  const projectConflicts = conflicts[proj] || [];
  const hasConflict = projectConflicts.some(conflictLicense => pkg.includes(conflictLicense));
  
  if (hasConflict) {
    return {
      package: pkgName,
      type: 'LICENSE',
      severity: 'HIGH',
      detail: `${pkgLicense} conflicts with ${projectLicense} project license`
    };
  }
  
  return null;
}
