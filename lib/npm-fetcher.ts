export async function fetchNpmLicenseAndVersion(name: string, version?: string): Promise<{license: string, version: string | undefined}> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
    if (!res.ok) return { license: 'UNKNOWN', version };
    const data = await res.json();
    const ver = version ?? data['dist-tags']?.latest;
    if (!ver || !data.versions || !data.versions[ver]) return { license: 'UNKNOWN', version: ver };
    
    let licenseField = data.versions[ver].license;
    if (typeof licenseField === 'string') {
      return { license: licenseField, version: ver };
    }
    if (licenseField && typeof licenseField === 'object' && licenseField.type) {
      return { license: licenseField.type, version: ver };
    }
    return { license: 'UNKNOWN', version: ver };
  } catch (error) {
    console.error(`Failed to fetch license for ${name}:`, error);
    return { license: 'UNKNOWN', version };
  }
}
