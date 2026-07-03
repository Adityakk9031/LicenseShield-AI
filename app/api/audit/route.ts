import { NextResponse } from 'next/server';
import { AuditRequest, AuditVerdict, RiskItem, PackageInput } from '@/lib/types';
import { fetchNpmLicenseAndVersion } from '@/lib/npm-fetcher';
import { queryOSVBatch } from '@/lib/osv-client';
import { checkLicenseCompatibility } from '@/lib/license-engine';
import { settleAuditOrder } from '@/lib/croo-cap';

export async function POST(req: Request) {
  try {
    const body = await req.json() as AuditRequest;
    
    if (!body.packages || !Array.isArray(body.packages) || !body.projectLicense) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { packages, projectLicense } = body;
    const risks: RiskItem[] = [];
    const suggestions: string[] = [];

    // 1. Resolve licenses and versions from NPM/PyPI
    // Currently fetchNpmLicenseAndVersion works best for NPM. Let's map it.
    const resolvedPackages = await Promise.all(packages.map(async (pkg) => {
      // Simplification: assume npm for license fetch, otherwise 'UNKNOWN'
      if (pkg.ecosystem === 'npm') {
        const { license, version } = await fetchNpmLicenseAndVersion(pkg.name, pkg.version);
        return { ...pkg, license, version };
      } else {
        // Mock handling for pypi
        return { ...pkg, license: 'UNKNOWN', version: pkg.version };
      }
    }));

    // 2. Query OSV for Vulnerabilities in batch
    const osvResults = await queryOSVBatch(resolvedPackages);

    // 3. Process each package
    resolvedPackages.forEach(pkg => {
      // License Check
      const licenseConflict = checkLicenseCompatibility(pkg.name, pkg.license, projectLicense);
      if (licenseConflict) {
        risks.push(licenseConflict);
        if (licenseConflict.severity === 'HIGH') {
            suggestions.push(`Replace ${pkg.name} with a ${projectLicense}-compatible alternative (current: ${pkg.license})`);
        } else {
            suggestions.push(`Review license terms for ${pkg.name} (${pkg.license}) for potential conflicts`);
        }
      }

      // Vulnerability Check
      const vulns = osvResults.get(pkg.name) || [];
      if (vulns.length > 0) {
        // Simplify severity extraction, OSV might not always provide CVSS in severity array easily
        // We will mark all found vulnerabilities as HIGH for demonstration
        risks.push({
          package: pkg.name,
          type: 'VULNERABILITY',
          severity: 'HIGH',
          detail: `Found ${vulns.length} vulnerabilities (e.g. ${vulns[0].id})`
        });
        suggestions.push(`Upgrade or replace ${pkg.name} due to known vulnerabilities`);
      }
    });

    const status = risks.some(r => r.severity === 'HIGH') ? 'FLAGGED' : 'APPROVED';
    
    const verdict: Omit<AuditVerdict, 'capTransaction'> = {
      status,
      risks,
      suggestions: Array.from(new Set(suggestions)), // deduplicate
    };

    // 4. Settle via CROO CAP
    const capTx = await settleAuditOrder(verdict);

    const fullVerdict: AuditVerdict = {
      ...verdict,
      capTransaction: capTx
    };

    return NextResponse.json(fullVerdict);

  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
