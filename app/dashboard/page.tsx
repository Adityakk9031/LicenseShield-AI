'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiKeyInfo {
  keyPrefix: string;
  usageCount: number;
  monthlyLimit: number;
}

interface LogEntry {
  id: string;
  auditId: string;
  targetLicense: string;
  billedVia: string;
  createdAt: string;
  reportOutput?: { status?: string };
}

interface SubscriptionInfo {
  planTier: 'FREE' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: string;
  hasSubscription: boolean;
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free Developer',
  PRO: 'Pro Team',
  ENTERPRISE: 'Enterprise',
};

const TIER_SCANS: Record<string, string> = {
  FREE: '100 scans / month included',
  PRO: '10,000 scans / month included',
  ENTERPRISE: 'Unlimited scans included',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    async function activateCheckout() {
      // Returning from Stripe Checkout: ?checkout=success&session_id=cs_...
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (params.get('checkout') !== 'success' || !sessionId) return;

      try {
        const res = await fetch('/api/billing/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          setCheckoutSuccess(true);
          if (data.generatedKey) setGeneratedKey(data.generatedKey);
        }
      } catch (err) {
        console.error('Checkout activation failed:', err);
      }
      // Clean the URL so refresh doesn't re-verify
      window.history.replaceState({}, '', '/dashboard');
    }

    async function loadDashboardData() {
      try {
        const [keysRes, logsRes, subRes] = await Promise.all([
          fetch('/api/keys').then((r) => (r.ok ? r.json() : { keys: [] })),
          fetch('/api/logs').then((r) => (r.ok ? r.json() : { logs: [] })),
          fetch('/api/billing/subscription').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (subRes) setSubscription(subRes);

        const activeKeys = keysRes.keys || [];
        if (activeKeys.length > 0) {
          const k = activeKeys[0];
          setApiKeyInfo({ keyPrefix: k.keyPrefix, usageCount: k.usageCount || 0, monthlyLimit: k.monthlyLimit || 100 });
        } else {
          setApiKeyInfo({ keyPrefix: 'ls_live_demo', usageCount: 12, monthlyLimit: 100 });
        }

        setRecentLogs(logsRes.logs || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setApiKeyInfo({ keyPrefix: 'ls_live_demo', usageCount: 12, monthlyLimit: 100 });
      } finally {
        setLoading(false);
      }
    }

    activateCheckout().finally(() => loadDashboardData());
  }, []);

  const copyKey = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2500);
    } catch {
      // clipboard unavailable — user can select the text manually
    }
  };

  const planTier = subscription?.planTier ?? 'FREE';
  const isPaidTier = planTier !== 'FREE';

  const usageCount = apiKeyInfo?.usageCount ?? 0;
  const monthlyLimit = apiKeyInfo?.monthlyLimit ?? 100;
  const usagePct = Math.min(100, Math.round((usageCount / monthlyLimit) * 100));

  if (loading) {
    return (
      <div className="loading-panel" style={{ minHeight: 400 }}>
        <div className="loading-spinner-lg" />
        <p className="loading-text">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--emerald-light)' }}>
              Payment successful — {TIER_LABELS[planTier]} plan activated!
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--n-500)', lineHeight: 1.6 }}>
            Your subscription is active and your account has been upgraded. Your API key quota is now{' '}
            {planTier === 'ENTERPRISE' ? '1,000,000' : '10,000'} scans/month.
          </p>
          {generatedKey && (
            <div
              style={{
                marginTop: 12,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--emerald-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Your new live API key — shown only once
                </div>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--white)', wordBreak: 'break-all' }}>
                  {generatedKey}
                </code>
              </div>
              <button
                type="button"
                onClick={copyKey}
                className="btn-primary-glow"
                style={{ padding: '8px 16px', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {keyCopied ? 'Copied ✓' : 'Copy key'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page heading */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          Dashboard Overview
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Developer Console
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n-600)', marginTop: 6 }}>
          Monitor API usage, subscription tier, and recent compliance scans in real-time.
        </p>
      </div>

      {/* Stats row */}
      <div className="dash-stat-grid">
        {/* Plan card */}
        <div className="dash-stat-card" style={{ borderColor: isPaidTier ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.2)' }}>
          <div className="dash-stat-label">
            Current Plan
            <span className={`plan-tag ${isPaidTier ? 'pro' : ''}`} style={isPaidTier ? { background: 'rgba(16,185,129,0.12)', color: 'var(--emerald-light)', borderColor: 'rgba(16,185,129,0.35)' } : undefined}>
              {planTier}
            </span>
          </div>
          <div
            className="dash-stat-value"
            style={{ fontSize: 28, color: isPaidTier ? 'var(--emerald-light)' : 'var(--violet-light)' }}
          >
            {TIER_LABELS[planTier]}
          </div>
          <div className="dash-stat-sub" style={{ marginTop: 12 }}>
            {TIER_SCANS[planTier]}
          </div>
          {isPaidTier ? (
            <Link
              href="/billing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--emerald-light)',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                transition: 'all 0.2s',
              }}
            >
              Manage billing →
            </Link>
          ) : (
            <Link
              href="/billing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--violet-light)',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                transition: 'all 0.2s',
              }}
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>

        {/* Monthly quota card */}
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            Monthly Usage
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--violet-light)', fontWeight: 700 }}>
              {usageCount}/{monthlyLimit}
            </span>
          </div>
          <div className="dash-stat-value">{usagePct}%</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--n-600)' }}>
            <span>{usagePct}% consumed</span>
            <span>{monthlyLimit - usageCount} remaining</span>
          </div>
        </div>

        {/* Total scans card */}
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            Total Scans
            <span style={{ fontSize: 16 }}>⚡</span>
          </div>
          <div className="dash-stat-value">{recentLogs.length || usageCount}</div>
          <div className="dash-stat-sub" style={{ color: 'var(--emerald-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block' }} />
            All systems operational
          </div>
          <Link
            href="/dashboard/logs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--n-500)',
              transition: 'color 0.2s',
            }}
          >
            View audit logs →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Quick Actions
          </div>
          <div className="quick-action-grid">
            <Link href="/dashboard/keys" className="quick-action-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="quick-action-icon">🔑</div>
                <span className="quick-action-arrow">→</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="quick-action-title">Manage API Keys</div>
                <div className="quick-action-sub">Generate, view prefix, or revoke keys</div>
              </div>
            </Link>

            <Link href="/dashboard/logs" className="quick-action-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="quick-action-icon">📜</div>
                <span className="quick-action-arrow">→</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="quick-action-title">Audit Log History</div>
                <div className="quick-action-sub">Browse past compliance reports & JSON output</div>
              </div>
            </Link>

            <Link
              href="/billing"
              className="quick-action-card"
              style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="quick-action-icon" style={{ background: 'rgba(124,58,237,0.15)' }}>💎</div>
                <span style={{ fontSize: 12, color: 'var(--violet-light)' }}>→</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="quick-action-title" style={{ color: 'var(--violet-light)' }}>Upgrade to Pro</div>
                <div className="quick-action-sub">Stripe test-mode checkout · 10k scans/mo</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Scans table */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">Recent Compliance Scans</div>
          <Link href="/dashboard/logs" className="dash-table-link">
            View All →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Status</th>
                <th>Target License</th>
                <th>Payment Channel</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No recent audit logs found. Run a scan via API to populate history.
                  </td>
                </tr>
              ) : (
                recentLogs.slice(0, 5).map((log) => {
                  const isApproved = log.reportOutput?.status === 'APPROVED';
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--violet-light)', fontWeight: 600 }}>{log.auditId}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            background: isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            color: isApproved ? 'var(--emerald-light)' : '#fb7185',
                            border: isApproved ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(244,63,94,0.25)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {log.reportOutput?.status || 'APPROVED'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--n-300)' }}>{log.targetLicense}</td>
                      <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-500)', fontSize: 12 }}>
                        {log.billedVia === 'BASE_SEPOLIA_USDC' ? '⚡ Base Sepolia USDC' : '💳 Stripe'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--n-600)', fontSize: 12 }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Web3 Integration Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'rgba(124,58,237,0.04)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>💳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>Model A — Stripe SaaS</div>
              <div style={{ fontSize: 11, color: 'var(--violet-light)' }}>Human Engineering Teams</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--n-600)', lineHeight: 1.6 }}>
            Monthly subscription with API key authentication. Test-mode Stripe checkout with webhook auto-provisioning.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(16,185,129,0.03)',
            border: '1px solid rgba(16,185,129,0.12)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>Model B — Base Sepolia USDC</div>
              <div style={{ fontSize: 11, color: 'var(--emerald-light)' }}>Autonomous AI Agents (x402)</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--n-600)', lineHeight: 1.6 }}>
            Per-scan $0.01 USDC micro-payment escrow on Base Sepolia testnet. x402 Protocol for AI agent billing.
          </p>
        </div>
      </div>
    </div>
  );
}
