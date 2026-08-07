'use client';

import { AuditReportData } from './HeroAudit';

interface AuditResultsViewProps {
  report: AuditReportData;
  onReset: () => void;
}

export default function AuditResultsView({ report, onReset }: AuditResultsViewProps) {
  const isApproved = report.status === 'APPROVED';

  return (
    <section className="report-section">
      <div className="report-container">
        {/* Header Action Bar */}
        <div className="report-nav-bar">
          <button type="button" onClick={onReset} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Run Another Audit</span>
          </button>

          <div className="billed-pill">
            <span>Billed via: {report.billedVia}</span>
          </div>
        </div>

        {/* Banner Card */}
        <div className={`verdict-banner ${isApproved ? 'approved' : 'flagged'}`}>
          <div className="verdict-icon-wrap">
            {isApproved ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          <div className="verdict-details">
            <div className="verdict-status-badge">
              {isApproved ? 'APPROVED — PASSED COMPLIANCE' : 'FLAGGED — RISKS DETECTED'}
            </div>
            <h2 className="verdict-title">
              {isApproved
                ? `Dependency Tree Compliant for ${report.targetLicense} License`
                : `License Conflict or CVE Vulnerabilities Found`}
            </h2>
            <p className="verdict-reason">{report.overallReason}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card glass-card">
            <span className="stat-value">{report.packagesScanned}</span>
            <span className="stat-label">Packages Scanned</span>
          </div>
          <div className="stat-card glass-card">
            <span className={`stat-value ${report.flaggedCount > 0 ? 'text-rose' : 'text-emerald'}`}>
              {report.flaggedCount}
            </span>
            <span className="stat-label">Flagged Dependencies</span>
          </div>
          <div className="stat-card glass-card">
            <span className={`stat-value ${report.vulnerabilityCount > 0 ? 'text-rose' : 'text-emerald'}`}>
              {report.vulnerabilityCount}
            </span>
            <span className="stat-label">Known Vulnerabilities (CVEs)</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value text-indigo">{report.targetLicense}</span>
            <span className="stat-label">Project Target License</span>
          </div>
        </div>

        {/* Packages Breakdown Matrix */}
        <div className="breakdown-card glass-card">
          <h3 className="card-section-title">Dependency Compliance Matrix</h3>
          <div className="table-wrapper">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Version</th>
                  <th>Declared License</th>
                  <th>Vulnerabilities</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.risks.map((pkg, idx) => {
                  const pkgStatus = pkg.status || (pkg.vulnerabilities && pkg.vulnerabilities.length > 0 ? 'FLAGGED' : 'APPROVED');
                  const isPkgApproved = pkgStatus === 'APPROVED';

                  return (
                    <tr key={idx} className={isPkgApproved ? 'row-approved' : 'row-flagged'}>
                      <td className="pkg-name-cell">
                        <code>{pkg.name}</code>
                      </td>
                      <td>{pkg.version || 'latest'}</td>
                      <td>
                        <span className="license-tag">{pkg.license || 'UNKNOWN'}</span>
                      </td>
                      <td>
                        {pkg.vulnerabilities && pkg.vulnerabilities.length > 0 ? (
                          <span className="cve-count-badge">
                            {pkg.vulnerabilities.length} OSV CVE(s)
                          </span>
                        ) : (
                          <span className="clean-badge">Clean</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${isPkgApproved ? 'pill-green' : 'pill-red'}`}>
                          {pkgStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggested Alternatives if Flagged */}
        {report.suggestedAlternatives && report.suggestedAlternatives.length > 0 && (
          <div className="alternatives-card glass-card">
            <h3 className="card-section-title">Recommended Safe Alternatives</h3>
            <p className="card-section-desc">
              Consider replacing high-risk or incompatible dependencies with these clean alternatives:
            </p>
            <div className="alternatives-tags">
              {report.suggestedAlternatives.map((alt, idx) => (
                <span key={idx} className="alt-tag">
                  ✨ {alt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Settlement Transaction Info */}
        {report.settlementTxHash && (
          <div className="settlement-card glass-card">
            <div className="settlement-left">
              <span className="settlement-icon">⛓️</span>
              <div>
                <div className="settlement-title">On-Chain Base Sepolia Settlement</div>
                <div className="settlement-hash">Tx: {report.settlementTxHash}</div>
              </div>
            </div>
            <a
              href={`https://sepolia.basescan.org/tx/${report.settlementTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-tx-link"
            >
              View on Basescan ↗
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
