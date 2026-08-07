'use client';

import React, { useState, useEffect } from 'react';

interface AuditLogItem {
  id: string;
  auditId: string;
  billedVia: string;
  targetLicense: string;
  packagesScanned: unknown;
  reportOutput: { status?: string; risks?: unknown[]; suggestions?: string[]; aiAnalysis?: string };
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (e) {
        console.error('Fetch logs error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.auditId.toLowerCase().includes(search.toLowerCase()) ||
      log.targetLicense.toLowerCase().includes(search.toLowerCase());
    const reportStatus = log.reportOutput?.status || 'APPROVED';
    const matchesVerdict = verdictFilter === 'ALL' || reportStatus === verdictFilter;
    const matchesChannel = channelFilter === 'ALL' || log.billedVia === channelFilter;
    return matchesSearch && matchesVerdict && matchesChannel;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page heading */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>📜</span>
          Audit Logs
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Audit Log History
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n-600)', marginTop: 6 }}>
          Full history of compliance scans — view verdicts, risk tables, and AI analysis reports.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search by Audit ID or License..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', fontSize: 13 }}
        />
        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          className="field-select"
          style={{ width: 160, padding: '9px 36px 9px 12px', fontSize: 13 }}
        >
          <option value="ALL">All Verdicts</option>
          <option value="APPROVED">✓ Approved</option>
          <option value="FLAGGED">⚠ Flagged</option>
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="field-select"
          style={{ width: 200, padding: '9px 36px 9px 12px', fontSize: 13 }}
        >
          <option value="ALL">All Channels</option>
          <option value="STRIPE_SUBSCRIPTION">💳 Stripe</option>
          <option value="BASE_SEPOLIA_USDC">⚡ Base Sepolia</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--n-600)', fontFamily: 'var(--font-mono)' }}>
          {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Logs Table */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">Compliance Scan Records</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(16,185,129,0.08)',
                color: 'var(--emerald-light)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {logs.filter(l => l.reportOutput?.status === 'APPROVED').length} approved
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(244,63,94,0.08)',
                color: '#fb7185',
                border: '1px solid rgba(244,63,94,0.2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {logs.filter(l => l.reportOutput?.status === 'FLAGGED').length} flagged
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Verdict</th>
                <th>Target License</th>
                <th>Payment Channel</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty">Loading audit logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    {search || verdictFilter !== 'ALL' || channelFilter !== 'ALL'
                      ? 'No logs match your filters.'
                      : 'No audit logs found. Run a scan via API to populate history.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isApproved = log.reportOutput?.status === 'APPROVED';
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--violet-light)', fontWeight: 600 }}>{log.auditId}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999, fontSize: 10,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            background: isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            color: isApproved ? 'var(--emerald-light)' : '#fb7185',
                            border: isApproved ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(244,63,94,0.25)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {isApproved ? '✓' : '⚠'} {log.reportOutput?.status || 'APPROVED'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--n-300)' }}>{log.targetLicense}</td>
                      <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-500)', fontSize: 12 }}>
                        {log.billedVia === 'BASE_SEPOLIA_USDC' ? '⚡ Base Sepolia' : '💳 Stripe'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-600)', fontSize: 12 }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-sans)' }}>
                        <button
                          onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                          style={{
                            padding: '5px 12px',
                            background: selectedLog?.id === log.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                            border: selectedLog?.id === log.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border-subtle)',
                            color: selectedLog?.id === log.id ? 'var(--violet-light)' : 'var(--n-500)',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {selectedLog?.id === log.id ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Report Panel */}
      {selectedLog && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: 28,
            animation: 'scale-in 0.2s ease forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--n-600)', marginBottom: 4 }}>
                Audit Report
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--violet-light)', fontWeight: 600 }}>
                {selectedLog.auditId}
              </div>
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              style={{ background: 'none', border: 'none', color: 'var(--n-600)', cursor: 'pointer', fontSize: 18, padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Report metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Target License', value: selectedLog.targetLicense },
              { label: 'Payment Channel', value: selectedLog.billedVia === 'BASE_SEPOLIA_USDC' ? '⚡ Base Sepolia USDC' : '💳 Stripe' },
              { label: 'Scan Date', value: new Date(selectedLog.createdAt).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.025)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--n-700)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--n-300)', fontFamily: 'var(--font-mono)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {selectedLog.reportOutput?.aiAnalysis && (
            <div
              style={{
                background: 'linear-gradient(to right, rgba(124,58,237,0.06), rgba(16,185,129,0.03))',
                border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #a78bfa, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ✦ Gemini 2.5 Flash AI Analysis
              </div>
              <p style={{ fontSize: 13, color: 'var(--n-400)', lineHeight: 1.7 }}>
                {selectedLog.reportOutput.aiAnalysis}
              </p>
            </div>
          )}

          {/* Raw JSON */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--n-700)', marginBottom: 10 }}>
              Raw Report JSON
            </div>
            <pre
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                fontSize: 11,
                color: 'var(--n-400)',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                lineHeight: 1.7,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(selectedLog.reportOutput, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
