'use client';

import { useState } from 'react';

export default function MixpanelTabShowcase() {
  const [activeTab, setActiveTab] = useState<'audit' | 'matrix' | 'osv' | 'escrow' | 'workspace'>('audit');

  return (
    <div id="showcase" className="tab-showcase-container">
      {/* Mixpanel Style Top Tab Navigation Bar */}
      <div className="tab-nav-bar">
        <button
          className={`tab-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <span>✨ Autonomous AI Audit</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          <span>📊 License Compatibility Matrix</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'osv' ? 'active' : ''}`}
          onClick={() => setActiveTab('osv')}
        >
          <span>🛡️ Vulnerability Intelligence</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'escrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('escrow')}
        >
          <span>⛓️ Base Sepolia Escrow</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          <span>🔑 API Keys &amp; Workspace</span>
        </button>
      </div>

      {/* Main Window Frame */}
      <div className="showcase-window-frame">
        <div className="window-header-bar">
          <div className="window-dots">
            <span className="w-dot red" />
            <span className="w-dot yellow" />
            <span className="w-dot green" />
          </div>
          <div className="window-title">
            licenseshield-console // {activeTab}.view.ts
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)' }}>
            ● System Active
          </div>
        </div>

        <div className="window-body">
          {activeTab === 'audit' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Input Dependency Stream
                </div>
                <div style={{ background: '#050609', border: '1px solid var(--border-medium)', borderRadius: 10, padding: 18, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7 }}>
                  <span style={{ color: 'var(--brand-purple)' }}>colors</span>@1.4.1<br />
                  <span style={{ color: 'var(--brand-purple)' }}>lodash</span>@4.17.20<br />
                  <span style={{ color: 'var(--brand-purple)' }}>express</span>@4.17.1<br />
                  <span style={{ color: 'var(--brand-purple)' }}>chalk</span>@5.3.0
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase' }}>
                  AI Security Analysis Output
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 700 }}>FLAGGED</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>2 High-Severity Risks Detected</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                    Audit flagged due to protestware vulnerability in <code>colors@1.4.1</code> and prototype pollution CVE in <code>lodash@4.17.20</code>.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)', background: 'rgba(0, 210, 255, 0.1)', padding: '3px 10px', borderRadius: 12 }}>
                      ✨ Replace with colorette@2.0.20
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)', background: 'rgba(0, 210, 255, 0.1)', padding: '3px 10px', borderRadius: 12 }}>
                      ✨ Upgrade to lodash@4.17.21
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
                Open-Source License Compatibility Policy Matrix
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { name: 'MIT', status: 'Permissive', compat: '100% Compatible', color: 'var(--brand-emerald)' },
                  { name: 'Apache-2.0', status: 'Patent Grant', compat: '100% Compatible', color: 'var(--brand-emerald)' },
                  { name: 'BSD-3-Clause', status: 'Permissive', compat: '100% Compatible', color: 'var(--brand-emerald)' },
                  { name: 'GPL-3.0', status: 'Copyleft Risk', compat: 'Requires Review', color: '#F59E0B' },
                  { name: 'AGPL-3.0', status: 'Strong Copyleft', compat: 'Incompatible', color: '#EF4444' },
                ].map((item) => (
                  <div key={item.name} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{item.status}</div>
                    <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: item.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                      {item.compat}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'osv' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Live OSV.dev Batch Vulnerability Stream</div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)' }}>Updated 2 mins ago</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'GHSA-v88g-cgmw-v5pv', pkg: 'colors@1.4.1', type: 'Protestware Denial of Service', sev: 'CRITICAL' },
                  { id: 'GHSA-p6mc-m468-83gw', pkg: 'lodash@4.17.20', type: 'Prototype Pollution Vulnerability', sev: 'HIGH' },
                  { id: 'GHSA-74fj-2852-25mc', pkg: 'express@4.17.1', type: 'Open Redirect & ReDoS', sev: 'MEDIUM' },
                ].map((cve) => (
                  <div key={cve.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: cve.sev === 'CRITICAL' ? '#EF4444' : cve.sev === 'HIGH' ? '#F97316' : '#F59E0B', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                        {cve.sev}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{cve.type}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>{cve.pkg} · {cve.id}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--brand-purple)', fontFamily: 'var(--font-mono)' }}>OSV Advisory ↗</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'escrow' && (
            <div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brand-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ON-CHAIN ESCROW CONTRACT VERIFIED
                    </div>
                    <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                      0x036CbD53842c5426634e7929541eC2318f3dCF7e
                    </div>
                  </div>
                  <span style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--brand-emerald)', fontWeight: 600 }}>
                    Base Sepolia Testnet
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--bg-surface-2)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>$0.01 USDC</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Micro-Audit Escrow Fee</span>
                </div>
                <div style={{ background: 'var(--bg-surface-2)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand-emerald)', fontFamily: 'var(--font-display)' }}>Instant</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>On-Chain Verification</span>
                </div>
                <div style={{ background: 'var(--bg-surface-2)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand-purple)', fontFamily: 'var(--font-display)' }}>0 Sign-Up</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Web3 Wallet Native</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Developer API Keys &amp; Subscription Quota</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Model A SaaS Plan: Pro Tier</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(120, 82, 255, 0.2)', color: 'var(--brand-purple-hover)', fontSize: 12, fontWeight: 600 }}>
                  Active Plan
                </span>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Your Active API Key</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="password"
                    readOnly
                    value="ls_live_demo_key_998877665544332211"
                    style={{ flex: 1, background: '#050609', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  />
                  <button style={{ padding: '10px 18px', background: 'var(--brand-purple)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    Copy Key
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Monthly Scan Usage</span>
                <span>4,280 / 10,000 Scans (42%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#050609', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: 'linear-gradient(90deg, var(--brand-purple), var(--brand-cyan))', borderRadius: 4 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
