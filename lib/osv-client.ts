export interface OSVQueryResult {
  id: string;
  summary?: string;
  details?: string;
  severity?: any[];
}

export async function queryOSVBatch(packages: {name: string, version: string | undefined, ecosystem: string}[]): Promise<Map<string, OSVQueryResult[]>> {
  if (packages.length === 0) return new Map();
  
  const queries = packages.map(pkg => {
    if (pkg.version) {
      return { package: { name: pkg.name, ecosystem: pkg.ecosystem === 'npm' ? 'npm' : 'PyPI' }, version: pkg.version };
    }
    // OSV typically requires a version when querying for vulnerabilities associated with a package version,
    // but we can query just the package if version is omitted.
    return { package: { name: pkg.name, ecosystem: pkg.ecosystem === 'npm' ? 'npm' : 'PyPI' } };
  });

  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries })
    });
    
    if (!res.ok) {
        console.error('OSV batch query failed with status', res.status);
        return new Map();
    }
    const data = await res.json();
    
    const resultsMap = new Map<string, OSVQueryResult[]>();
    data.results?.forEach((result: any, index: number) => {
      const pkgName = packages[index].name;
      if (result.vulns) {
        resultsMap.set(pkgName, result.vulns);
      } else {
        resultsMap.set(pkgName, []);
      }
    });
    
    return resultsMap;
  } catch (error) {
    console.error('OSV API error:', error);
    return new Map();
  }
}
