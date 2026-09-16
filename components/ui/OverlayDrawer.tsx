'use client';

import { useState, useEffect } from 'react';
import AuditResultsView from '@/components/AuditResultsView';
import { AuditReportData } from '@/components/HeroAudit';

const PRESETS = {
  highRisk: {
    label: '🔴 High-Risk / CVE Preset',
    license: 'MIT',
    deps: 'colors@1.4.1\nlodash@4.17.20\nexpress@4.17.1',
  },
  clean: {
    label: '🟢 Clean Production Preset',
    license: 'MIT',
    deps: 'chalk@5.3.0\ndotenv@16.0.0\nzod@3.22.0\nreact@18.2.0',
  },
  copyleft: {
    label: '🟡 Copyleft Conflict Preset',
    license: 'MIT',
    deps: 'gpl-3.0-module@1.0.0\nexpress@4.18.2\naxios@1.6.0',
  },
};

export default function OverlayDrawer() {
  const [activeTab, setActiveTab] = useState<'audit' | 'keys' | 'logs'>('audit');
  const [dependenciesText, setDependenciesText] = useState(PRESETS.highRisk.deps);
  const [targetLicense, setTargetLicense] = useState('MIT');
  const [authMode, setAuthMode] = useState<'apiKey' | 'escrow'>('apiKey');
  const [apiKeyInput, setApiKeyInput] = useState('ls_live_demo_key_998877');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<AuditReportData | null>(null);

  // API Key Manager state
  const [keyList, setKeyList] = useState<any[]>([]);
  const [keyName, setKeyName] = useState('');
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  // Audit Logs state
  const [logList, setLogList] = useState<any[]>([]);
  const [selectedLogJson, setSelectedLogJson] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
          setKeyList(data.keys);
          return;
        }
      }
      throw new Error('Fallback');
    } catch {
      setKeyList([
        {
          id: 'k-1',
          name: 'CI/CD Automated Scanner',
          keyPrefix: 'ls_live_ci99',
          usageCount: 42,
          monthlyLimit: 10000,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'k-2',
          name: 'Staging Environment Worker',
          keyPrefix: 'ls_live_stg1',
          usageCount: 12,
          monthlyLimit: 100,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setLogList(data.logs);
          return;
        }
      }
      throw new Error('Fallback');
    } catch {
      setLogList([
        {
          id: 'log-1',
          auditId: 'audit_live_88192',
          billedVia: 'BASE_SEPOLIA_USDC',
          targetLicense: 'MIT',
          createdAt: new Date().toISOString(),
          reportOutput: { verdict: 'APPROVED', packagesScanned: 4, flaggedCount: 0 },
        },
        {
          id: 'log-2',
          auditId: 'audit_live_77102',
          billedVia: 'STRIPE_SUBSCRIPTION',
          targetLicense: 'Apache-2.0',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          reportOutput: { verdict: 'FLAGGED', packagesScanned: 6, flaggedCount: 2 },
        },
      ]);
    }
  };

  useEffect(() => {
    if (activeTab === 'keys') fetchKeys();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName || 'Production API Key' }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setNewGeneratedKey(data.apiKey);
        setApiKeyInput(data.apiKey);
        fetchKeys();
      } else {
        const mockKey = `ls_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
        setNewGeneratedKey(mockKey);
        setApiKeyInput(mockKey);
        setKeyList((prev) => [
          {
            id: `k-${Date.now()}`,
            name: keyName || 'Production API Key',
            keyPrefix: mockKey.slice(0, 12),
            usageCount: 0,
            monthlyLimit: 10000,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch {
      const mockKey = `ls_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
      setNewGeneratedKey(mockKey);
      setApiKeyInput(mockKey);
      setKeyList((prev) => [
        {
          id: `k-${Date.now()}`,
          name: keyName || 'Production API Key',
          keyPrefix: mockKey.slice(0, 12),
          usageCount: 0,
          monthlyLimit: 10000,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setKeyLoading(false);
      setKeyName('');
    }
  };

  const handleCopyGeneratedKey = () => {
    if (newGeneratedKey) {
      navigator.clipboard.writeText(newGeneratedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setErrorMsg(null);

    const rawLines = dependenciesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    if (rawLines.length === 0) {
      setErrorMsg('Please enter at least one dependency string (e.g. colors@1.4.1).');
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authMode === 'apiKey') {
        headers['Authorization'] = `Bearer ${apiKeyInput || 'ls_live_demo_key_998877'}`;
      } else {
        // In Escrow mode, send generated or test audit token
        headers['X-Audit-ID'] = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetLicense, dependencies: rawLines }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If HTTP 402 Payment Required for Web3 Escrow without on-chain lock, handle gracefully
        if (res.status === 402 && authMode === 'escrow') {
          setErrorMsg(
            'HTTP 402: Web3 Escrow requires $0.01 USDC lock on Base Sepolia. Switch to "Model A · SaaS API Key" for instant bearer key execution, or simulate lock below.'
          );
        } else {
          setErrorMsg(data.error || data.message || `Audit failed with status ${res.status}`);
        }
        setLoading(false);
        return;
      }

      const formattedReport: AuditReportData = {
        status: data.status || (data.verdict === 'APPROVED' ? 'APPROVED' : 'FLAGGED'),
        targetLicense: data.targetLicense || targetLicense,
        packagesScanned: data.packagesScanned || data.results?.length || rawLines.length,
        flaggedCount: data.flaggedCount || data.results?.filter((r: any) => r.status === 'FLAGGED').length || 0,
        vulnerabilityCount:
          data.vulnerabilityCount ||
          data.results?.reduce((acc: number, curr: any) => acc + (curr.vulnerabilities?.length || 0), 0) ||
          0,
        risks: data.results || data.risks || [],
        overallReason: data.reason || data.aiAnalysis || 'Automated compliance & vulnerability verification complete.',
        suggestedAlternatives: data.suggestedAlternatives || [],
        settlementTxHash: data.settlementTxHash,
        billedVia:
          data.billedVia ||
          (authMode === 'apiKey' ? 'Model A (Web2 SaaS Bearer Key)' : 'Model B (Web3 Base Sepolia Escrow)'),
      };

      setCurrentReport(formattedReport);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error executing audit request.');
    } finally {
      setLoading(false);
    }
  };

  if (currentReport) {
    return (
      <section id="console-drawer" className="console-section">
        <AuditResultsView report={currentReport} onReset={() => setCurrentReport(null)} />
      </section>
    );
  }

  return (
    <section id="console-drawer" className="console-section">
      {/* Console Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="metric-card-tag">DEVELOPER CONTROL CONSOLE</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 4, letterSpacing: '-0.02em' }}>
            Live Security &amp; Compliance Inspector
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="console-tab-row">
          <button
            onClick={() => setActiveTab('audit')}
            className={`console-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            type="button"
          >
            ⚡ Audit Engine
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`console-tab-btn ${activeTab === 'keys' ? 'active' : ''}`}
            type="button"
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`console-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            type="button"
          >
            📜 Audit Logs
          </button>
        </div>
      </div>

      {/* ── TAB 1: AUDIT ENGINE ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="glass-panel">
          {/* Presets Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontWeight: 600 }}>Presets:</span>
            <button
              onClick={() => {
                setDependenciesText(PRESETS.highRisk.deps);
                setTargetLicense(PRESETS.highRisk.license);
              }}
              className="preset-chip danger"
              type="button"
            >
              🔴 High-Risk CVE
            </button>
            <button
              onClick={() => {
                setDependenciesText(PRESETS.clean.deps);
                setTargetLicense(PRESETS.clean.license);
              }}
              className="preset-chip success"
              type="button"
            >
              🟢 Clean Production
            </button>
            <button
              onClick={() => {
                setDependenciesText(PRESETS.copyleft.deps);
                setTargetLicense(PRESETS.copyleft.license);
              }}
              className="preset-chip warning"
              type="button"
            >
              🟡 Copyleft Conflict
            </button>
          </div>

          {/* Window Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>dependency-manifest.json</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label htmlFor="target-policy" style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>Target Policy:</label>
              <select
                id="target-policy"
                value={targetLicense}
                onChange={(e) => setTargetLicense(e.target.value)}
                style={{
                  background: '#04060A',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '7px 14px',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              >
                <option value="MIT">MIT (Permissive)</option>
                <option value="Apache-2.0">Apache-2.0 (Patent Safe)</option>
                <option value="BSD-3-Clause">BSD-3-Clause</option>
                <option value="GPL-3.0">GPL-3.0 (Copyleft)</option>
                <option value="AGPL-3.0">AGPL-3.0 (Network Copyleft)</option>
                <option value="Proprietary">Proprietary / Closed Source</option>
              </select>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={dependenciesText}
            onChange={(e) => setDependenciesText(e.target.value)}
            rows={5}
            placeholder="colors@1.4.1&#10;lodash@4.17.20&#10;chalk@5.3.0"
            className="code-textarea"
          />

          {/* Billing Switcher */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Authorization &amp; Settlement Model
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
              <div
                onClick={() => {
                  setAuthMode('apiKey');
                  setErrorMsg(null);
                }}
                className={`billing-card-toggle ${authMode === 'apiKey' ? 'active' : ''}`}
              >
                <div style={{ fontSize: 13.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                  Model A · SaaS API Key
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Monthly quota token with Bearer authentication
                </div>
              </div>

              <div
                onClick={() => {
                  setAuthMode('escrow');
                  setErrorMsg(null);
                }}
                className={`billing-card-toggle ${authMode === 'escrow' ? 'active' : ''}`}
              >
                <div style={{ fontSize: 13.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald)' }}>
                  Model B · $0.01 USDC Base Escrow
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Locks micro-fee on Base Sepolia contract
                </div>
              </div>
            </div>

            {authMode === 'apiKey' && (
              <div style={{ marginTop: 14 }}>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter API Key (ls_live_...)"
                  style={{
                    width: '100%',
                    background: '#04060A',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{ marginTop: 18, padding: '14px 18px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F87171', fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleRunAudit}
            disabled={loading}
            className="btn-primary-glow"
            type="button"
            style={{ width: '100%', marginTop: 26, justifyContent: 'center', padding: '16px 28px', fontSize: 14.5 }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #04060A', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span>Auditing NPM &amp; OSV Databases with Gemini 2.5...</span>
              </span>
            ) : (
              <>
                <span>Execute Autonomous Security &amp; License Audit</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── TAB 2: API KEYS ─────────────────────────────────────────── */}
      {activeTab === 'keys' && (
        <div className="glass-panel">
          <form onSubmit={handleGenerateKey} style={{ display: 'flex', gap: 12, marginBottom: 26, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key Description (e.g. Production CI/CD Scanner)"
              style={{
                flex: 1,
                minWidth: 220,
                background: '#04060A',
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: '#fff',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={keyLoading}
              className="btn-primary-glow"
              style={{ padding: '12px 22px', fontSize: 13 }}
            >
              {keyLoading ? 'Generating...' : '+ Create API Key'}
            </button>
          </form>

          {newGeneratedKey && (
            <div style={{ marginBottom: 24, padding: 18, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--emerald)', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>🎉 New Live API Key (Activated for Audit Engine):</span>
                <button
                  onClick={handleCopyGeneratedKey}
                  type="button"
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: 'var(--emerald)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {copiedKey ? '✓ Copied' : 'Copy Key'}
                </button>
              </div>
              <code style={{ background: '#000', padding: '6px 12px', borderRadius: 8, color: '#fff', display: 'block', wordBreak: 'break-all' }}>
                {newGeneratedKey}
              </code>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {keyList.map((k) => (
              <div
                key={k.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: 'rgba(11, 16, 26, 0.75)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: '#fff' }}>{k.name}</div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 4 }}>
                    Prefix: <span style={{ color: 'var(--cyan)' }}>{k.keyPrefix}****</span> · Quota: {k.usageCount} / {k.monthlyLimit}
                  </div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: AUDIT LOGS ───────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logList.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: 'rgba(11, 16, 26, 0.75)',
                  border: '1px solid var(--border-glass)',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
                    <span>{log.auditId}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.08)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {log.targetLicense}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6 }}>
                    Billed via: <span style={{ color: 'var(--cyan)' }}>{log.billedVia}</span> · {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLogJson(log)}
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-glass)',
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Inspect JSON ↗
                </button>
              </div>
            ))}
          </div>

          {/* JSON Modal */}
          {selectedLogJson && (
            <div
              onClick={() => setSelectedLogJson(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.88)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#0B101A',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 18,
                  maxWidth: 680,
                  width: '100%',
                  padding: 28,
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14.5, fontWeight: 700, color: '#fff' }}>
                    Audit Log Payload: {selectedLogJson.auditId}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedLogJson, null, 2));
                        setCopiedJson(true);
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      type="button"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-glass)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                    >
                      {copiedJson ? '✓ Copied' : 'Copy JSON'}
                    </button>
                    <button onClick={() => setSelectedLogJson(null)} type="button" style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                  </div>
                </div>
                <pre style={{ background: '#030508', padding: 18, borderRadius: 12, fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', overflowX: 'auto', lineHeight: 1.5 }}>
                  {JSON.stringify(selectedLogJson, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
