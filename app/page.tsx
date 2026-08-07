'use client';

import { useState } from 'react';
import HeroAudit, { AuditReportData } from '@/components/HeroAudit';
import AuditResultsView from '@/components/AuditResultsView';

export default function Home() {
  const [currentReport, setCurrentReport] = useState<AuditReportData | null>(null);

  return (
    <div className="home-container">
      {!currentReport ? (
        <HeroAudit onAuditComplete={(report) => setCurrentReport(report)} />
      ) : (
        <AuditResultsView report={currentReport} onReset={() => setCurrentReport(null)} />
      )}
    </div>
  );
}
