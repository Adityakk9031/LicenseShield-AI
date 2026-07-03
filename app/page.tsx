"use client";

import { useState } from 'react';
import AuditForm from '@/components/AuditForm';
import VerdictCard from '@/components/VerdictCard';
import RiskTable from '@/components/RiskTable';
import { PackageInput, AuditVerdict } from '@/lib/types';

export default function Home() {
  const [verdict, setVerdict] = useState<AuditVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async (packages: PackageInput[], projectLicense: string) => {
    setLoading(true);
    setError('');
    setVerdict(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages, projectLicense }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AuditVerdict = await res.json();
      setVerdict(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuditForm onAudit={handleAudit} loading={loading} />
      
      {error && (
        <div className="card" style={{ borderColor: 'var(--error)' }}>
          <div style={{ color: 'var(--error)' }}>Error: {error}</div>
        </div>
      )}

      {verdict && (
        <div style={{ marginTop: '2rem' }}>
          <VerdictCard verdict={verdict} />
          <RiskTable risks={verdict.risks} />
        </div>
      )}
    </div>
  );
}
