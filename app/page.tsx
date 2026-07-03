'use client';

import { useState } from 'react';

interface Risk {
  package: string;
  type: 'VULNERABILITY' | 'LICENSE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
}

interface AuditVerdict {
  status: 'APPROVED' | 'FLAGGED';
  risks: Risk[];
  suggestions: string[];
  capTransaction?: { orderId: string };
}

export default function Home() {
  const [input, setInput] = useState('colors@1.4.1\nlodash@4.17.20\nreact@18.2.0');
  const [projectLicense, setProjectLicense] = useState('MIT');
  const [verdict, setVerdict] = useState<AuditVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerdict(null);

    const packages = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const lastAt = line.lastIndexOf('@');
        if (lastAt > 0) {
          return { name: line.substring(0, lastAt), version: line.substring(lastAt + 1), ecosystem: 'npm' };
        }
        return { name: line, ecosystem: 'npm' };
      });

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages, projectLicense }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: AuditVerdict = await res.json();

      await new Promise(r => setTimeout(r, 1200));
      setVerdict(data);
    } catch (err: any) {
      setError(err.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="app-root">
      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          LicenseShield AI
        </a>
        <ul className="navbar-links">
          <li><a href="/" style={{ color: '#fff' }}>Audit</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/vault">Vault</a></li>
        </ul>
        <div className="navbar-badge">
          <span className="status-dot" />
          CROO Network
        </div>
      </nav>

      <div className="page-container">
        {/* HERO */}
        <section className="hero">
          <div className="hero-eyebrow anim-fade-up">Powered by CROO Agent Protocol</div>
          <h1 className="hero-title anim-fade-up anim-delay-1">
            Dependency<br />
            <span>security</span><br />
            audit.
          </h1>
          <p className="hero-sub anim-fade-up anim-delay-2">
            Scan npm packages for license conflicts and known CVEs in seconds. Settled on-chain via the CROO Network.
          </p>
        </section>

        {/* STATS */}
        <div className="stats-bar anim-fade-up anim-delay-3">
          <div className="stat-item">
            <div className="stat-value">2.4M+</div>
            <div className="stat-label">Packages indexed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">OSV.dev</div>
            <div className="stat-label">Vuln database</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">SPDX</div>
            <div className="stat-label">License engine</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">&lt;3s</div>
            <div className="stat-label">Avg scan time</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="audit-grid">
          {/* FORM */}
          <div className="glass-card anim-fade-up anim-delay-3">
            <div className="card-label">New Audit</div>

            <form onSubmit={handleAudit}>
              <div className="form-field">
                <label className="field-label">Project License</label>
                <select
                  className="field-select"
                  value={projectLicense}
                  onChange={e => setProjectLicense(e.target.value)}
                >
                  <option value="MIT">MIT License</option>
                  <option value="APACHE-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPLv3</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="PROPRIETARY">Proprietary</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Dependencies — one per line (name@version)</label>
                <textarea
                  className="field-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={'express@4.18.0\nlodash@4.17.21\ncolors@1.4.1'}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Run Security Audit
                  </>
                )}
              </button>

              {error && <div className="error-msg">{error}</div>}
            </form>
          </div>

          {/* RESULTS */}
          <div className="glass-card anim-fade-up anim-delay-4" style={{ minHeight: 480 }}>
            {loading ? (
              <div className="loading-panel">
                <div className="loading-spinner-lg" />
                <p className="loading-text">Querying NPM Registry & OSV.dev...</p>
              </div>
            ) : verdict ? (
              <>
                <div className="verdict-header">
                  <div>
                    <div
                      className={`verdict-badge ${verdict.status === 'APPROVED' ? 'approved' : 'flagged'}`}
                      style={{ marginBottom: 16 }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {verdict.status}
                    </div>
                    <div className={`verdict-title ${verdict.status === 'APPROVED' ? 'approved' : 'flagged'}`}>
                      {verdict.status === 'APPROVED' ? 'Clean.' : 'Flagged.'}
                    </div>
                    <div className="verdict-subtitle">
                      {verdict.risks.length === 0 ? 'No issues found — all clear.' : `${verdict.risks.length} risk${verdict.risks.length > 1 ? 's' : ''} detected across dependencies`}
                    </div>
                  </div>
                </div>

                {verdict.capTransaction?.orderId && (
                  <div className="tx-chip">
                    <span>CROO TX</span>
                    {verdict.capTransaction.orderId}
                  </div>
                )}

                {verdict.risks.length > 0 && (
                  <>
                    <div className="risk-list-header">{verdict.risks.length} Risk{verdict.risks.length > 1 ? 's' : ''} Found</div>
                    <div>
                      {verdict.risks.map((risk, i) => (
                        <div key={i} className="risk-item">
                          <div className={`risk-dot ${risk.severity}`} />
                          <div className="risk-info">
                            <div className="risk-package">{risk.package}</div>
                            <div className="risk-detail">{risk.detail}</div>
                          </div>
                          <div className={`risk-type-badge ${risk.type}`}>{risk.type}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {verdict.suggestions && verdict.suggestions.length > 0 && (
                  <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="risk-list-header" style={{ marginBottom: 12 }}>Suggestions</div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {verdict.suggestions.map((s, i) => (
                        <li key={i} style={{ fontSize: 14, color: '#a3a3a3', letterSpacing: '-0.01em', paddingLeft: 16, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="result-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>Run an audit to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <span>LicenseShield AI — CROO Network Agent</span>
          <span>Base Sepolia Testnet</span>
        </footer>
      </div>
    </div>
  );
}
