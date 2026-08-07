'use client';

import React, { useState, useEffect } from 'react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  usageCount: number;
  monthlyLimit: number;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Fetch keys error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.apiKey);
        setKeyName('');
        fetchKeys();
      }
    } catch (e) {
      console.error('Create key error:', e);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will lose access.')) return;
    try {
      const res = await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      if (res.ok) fetchKeys();
    } catch (e) {
      console.error('Revoke key error:', e);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page heading */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>🔑</span>
          API Keys
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          API Key Management
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n-600)', marginTop: 6 }}>
          Create and manage developer secret keys for authenticating Model A SaaS requests.
        </p>
      </div>

      {/* Newly Created Key Banner */}
      {newlyCreatedKey && (
        <div
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald-light)' }}>
                API Key Created Successfully
              </span>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              style={{ background: 'none', border: 'none', color: 'var(--n-600)', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--n-500)', marginBottom: 14, lineHeight: 1.6 }}>
            Copy your API key now. For security, <strong style={{ color: 'var(--white)' }}>it will never be displayed again</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="key-display" style={{ flex: 1, fontSize: 12 }}>{newlyCreatedKey}</div>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="btn-emerald"
              style={{ padding: '10px 18px', fontSize: 12, flexShrink: 0 }}
            >
              {copied ? '✓ Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>
      )}

      {/* Create Key Form */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.02em' }}>
          Create New Secret Key
        </div>
        <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="e.g. Production CI/CD Pipeline Key"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
            className="field-input"
            style={{ flex: 1, minWidth: 220 }}
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-brand"
            style={{ flexShrink: 0 }}
          >
            {creating ? (
              <><span className="spinner-white" /> Generating...</>
            ) : (
              <>+ Generate API Key</>
            )}
          </button>
        </form>
      </div>

      {/* Keys Table */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">Your Developer Keys</div>
          <span style={{ fontSize: 12, color: 'var(--n-600)' }}>{keys.filter(k => k.isActive).length} active</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key Prefix</th>
                <th>Usage / Limit</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-empty">Loading API keys...</td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No developer API keys created yet. Generate one above to start auditing.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ color: 'var(--white)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{k.name}</td>
                    <td style={{ color: 'var(--violet-light)' }}>{k.keyPrefix}...</td>
                    <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-400)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{k.usageCount} / {k.monthlyLimit}</span>
                        <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (k.usageCount / k.monthlyLimit) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #10b981)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-sans)' }}>
                      {k.isActive ? (
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999, fontSize: 10,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            background: 'rgba(16,185,129,0.1)', color: 'var(--emerald-light)',
                            border: '1px solid rgba(16,185,129,0.25)',
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
                          Active
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999, fontSize: 10,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            background: 'rgba(244,63,94,0.1)', color: '#fb7185',
                            border: '1px solid rgba(244,63,94,0.25)',
                          }}
                        >
                          Revoked
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-600)', fontSize: 12 }}>
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-sans)' }}>
                      {k.isActive && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          style={{
                            padding: '5px 12px',
                            background: 'rgba(244,63,94,0.06)',
                            border: '1px solid rgba(244,63,94,0.2)',
                            color: '#fb7185',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'var(--font-sans)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.12)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.06)')}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info callout */}
      <div
        style={{
          background: 'rgba(124,58,237,0.04)',
          border: '1px solid rgba(124,58,237,0.12)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--violet-light)', marginBottom: 4 }}>
            Security Notice
          </div>
          <p style={{ fontSize: 12, color: 'var(--n-600)', lineHeight: 1.6 }}>
            API keys are hashed using SHA-256 before storage. The full key is only shown once upon creation. 
            Keep your keys secure — treat them like passwords. Use <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--n-400)', fontSize: 11 }}>Authorization: Bearer &lt;key&gt;</span> in all API requests.
          </p>
        </div>
      </div>
    </div>
  );
}
