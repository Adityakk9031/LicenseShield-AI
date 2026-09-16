'use client';

import { AuditReportData } from './HeroAudit';

interface AuditResultsViewProps {
  report: AuditReportData;
  onReset: () => void;
}

export default function AuditResultsView({ report, onReset }: AuditResultsViewProps) {
  const isApproved = report.status === 'APPROVED';

  return (
    <section style={{ minHeight: '100vh', background: 'var(--cosmic-deep)', position: 'relative' }}>
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 300,
          background: 'linear-gradient(180deg, rgba(94,106,210,0.1) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ maxWidth: 1000, width: '100%', margin: '0 auto', padding: '80px 40px', position: 'relative' }}>

        {/* Header Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 44 }}>
          <button type="button" onClick={onReset} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Run Another Audit</span>
          </button>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            {report.billedVia}
          </div>
        </div>

        {/* Section label */}
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
          Section VIII · Audit Logs
        </div>

        {/* Verdict Banner */}
        <div className={`verdict-banner ${isApproved ? 'approved' : 'flagged'}`}>
          <div>
            {isApproved ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ADE9A" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, color: isApproved ? '#4ADE9A' : '#FF6B6B', fontFamily: 'var(--font-mono)' }}>
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
          <div className="stat-card">
            <span className="stat-value">{report.packagesScanned}</span>
            <span className="stat-label">Packages Scanned</span>
          </div>
          <div className="stat-card">
            <span className={`stat-value ${report.flaggedCount > 0 ? 'text-rose' : 'text-emerald'}`}>
              {report.flaggedCount}
            </span>
            <span className="stat-label">Flagged Dependencies</span>
          </div>
          <div className="stat-card">
            <span className={`stat-value ${report.vulnerabilityCount > 0 ? 'text-rose' : 'text-emerald'}`}>
              {report.vulnerabilityCount}
            </span>
            <span className="stat-label">Known CVEs</span>
          </div>
          <div className="stat-card">
            <span className="stat-value text-indigo">{report.targetLicense}</span>
            <span className="stat-label">Target License</span>
          </div>
        </div>

        {/* Packages Breakdown Matrix */}
        <div className="breakdown-card">
          <h3 className="card-section-title">Dependency Compliance Matrix</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Version</th>
                  <th>License</th>
                  <th>CVEs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.risks.map((pkg, idx) => {
                  const pkgStatus = pkg.status || (pkg.vulnerabilities && pkg.vulnerabilities.length > 0 ? 'FLAGGED' : 'APPROVED');
                  const isPkgApproved = pkgStatus === 'APPROVED';

                  return (
                    <tr key={idx}>
                      <td>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                          {pkg.name}
                        </code>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {pkg.version || 'latest'}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {pkg.license || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        {pkg.vulnerabilities && pkg.vulnerabilities.length > 0 ? (
                          <span className="badge incompatible">{pkg.vulnerabilities.length} CVE</span>
                        ) : (
                          <span className="badge compatible">Clean</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isPkgApproved ? 'compatible' : 'incompatible'}`}>
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

        {/* Suggested Alternatives */}
        {report.suggestedAlternatives && report.suggestedAlternatives.length > 0 && (
          <div className="breakdown-card">
            <h3 className="card-section-title">Recommended Safe Alternatives</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
              Consider replacing high-risk or incompatible dependencies with these clean alternatives:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {report.suggestedAlternatives.map((alt, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(94,106,210,0.12)',
                    border: '1px solid rgba(94,106,210,0.25)',
                    borderRadius: 20,
                    fontSize: 13,
                    color: '#7C83E8',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ✨ {alt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Settlement Transaction Info */}
        {report.settlementTxHash && (
          <div
            style={{
              padding: '20px 24px',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⛓️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(232,201,122,0.9)', marginBottom: 4 }}>
                  On-Chain Base Sepolia Settlement
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  Tx: {report.settlementTxHash}
                </div>
              </div>
            </div>
            <a
              href={`https://sepolia.basescan.org/tx/${report.settlementTxHash}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '8px 16px',
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(232,201,122,0.8)',
                cursor: 'pointer',
              }}
            >
              View on Basescan ↗
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
