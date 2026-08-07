'use client';

import Link from 'next/link';

export default function ReportsPage() {
  const MOCK_REPORTS = [
    {
      id: 'audit_01_colors_lodash',
      targetLicense: 'MIT',
      packagesCount: 3,
      flaggedCount: 2,
      status: 'FLAGGED',
      reason: 'Protestware risk in colors@1.4.1 and prototype pollution in lodash@4.17.20',
      date: 'Just now',
    },
    {
      id: 'audit_02_chalk_zod',
      targetLicense: 'MIT',
      packagesCount: 4,
      flaggedCount: 0,
      status: 'APPROVED',
      reason: 'All dependencies fully compliant with permissive MIT license terms',
      date: '10 mins ago',
    },
    {
      id: 'audit_03_gpl_conflict',
      targetLicense: 'Proprietary',
      packagesCount: 3,
      flaggedCount: 1,
      status: 'FLAGGED',
      reason: 'GPL-3.0 copyleft dependency inside proprietary project payload',
      date: '1 hour ago',
    },
  ];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1 className="reports-title">Recent Audit Reports</h1>
        <p className="reports-subtitle">
          History of autonomous security audits & license compliance scans.
        </p>

        <Link href="/" className="btn-new-audit">
          + Run New Audit
        </Link>
      </div>

      <div className="reports-list">
        {MOCK_REPORTS.map((rpt) => (
          <div key={rpt.id} className="report-row-card glass-card">
            <div className="report-row-left">
              <span className={`status-pill ${rpt.status === 'APPROVED' ? 'pill-green' : 'pill-red'}`}>
                {rpt.status}
              </span>
              <div>
                <h3 className="report-row-title">{rpt.reason}</h3>
                <div className="report-row-meta">
                  <span>Target: {rpt.targetLicense}</span> · <span>{rpt.packagesCount} packages scanned</span> · <span>{rpt.date}</span>
                </div>
              </div>
            </div>

            <div className="report-row-right">
              <span className="audit-id-tag"><code>{rpt.id}</code></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
