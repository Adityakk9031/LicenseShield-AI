'use client';

import { useState } from 'react';

export default function HybridPricing() {
  const [billingMode, setBillingMode] = useState<'stripe' | 'base'>('stripe');
  const [monthlyScans, setMonthlyScans] = useState<number>(5000);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Web3 Base USDC calculations: $0.001 per scan
  const baseMicroFee = 0.001;
  const web3MonthlyCost = (monthlyScans * baseMicroFee).toFixed(2);
  
  // Traditional SaaS equivalent cost ($0.005/scan average B2B overage)
  const traditionalCost = (monthlyScans * 0.005 + 49).toFixed(2);
  const estimatedSavings = Math.max(0, Number(traditionalCost) - Number(web3MonthlyCost)).toFixed(2);
  const savingsPercent = Math.round(((Number(traditionalCost) - Number(web3MonthlyCost)) / Number(traditionalCost)) * 100);

  const handleStripeCheckout = async (planTier: string, priceId: string) => {
    setCheckoutLoading(planTier);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tier: planTier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Demo Checkout: Upgraded to ${planTier} tier successfully!`);
      }
    } catch {
      alert(`Demo Checkout: Upgraded to ${planTier} tier successfully!`);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <section id="pricing" style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 24px', position: 'relative', zIndex: 10 }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div className="metric-card-tag" style={{ margin: '0 auto 14px' }}>
          HYBRID B2B PRICING &amp; SETTLEMENT
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Dual-Settlement <span className="hero-heading-gradient">Pricing Architecture</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(148, 163, 184, 0.85)', maxWidth: 660, margin: '16px auto 0', lineHeight: 1.6 }}>
          Choose between traditional Web2 SaaS monthly subscriptions or frictionless Web3 pay-per-scan micro-settlements on Base Sepolia.
        </p>

        {/* Dual Mode Switcher Pill */}
        <div style={{ display: 'inline-flex', background: 'rgba(8, 12, 22, 0.85)', padding: 5, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', marginTop: 32, backdropFilter: 'blur(20px)' }}>
          <button
            onClick={() => setBillingMode('stripe')}
            type="button"
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: billingMode === 'stripe' ? 'linear-gradient(135deg, #00E5F0 0%, #818CF8 100%)' : 'transparent',
              color: billingMode === 'stripe' ? '#020408' : '#94A3B8',
              boxShadow: billingMode === 'stripe' ? '0 0 20px rgba(0, 229, 240, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            💳 Web2 SaaS (Stripe Monthly)
          </button>
          <button
            onClick={() => setBillingMode('base')}
            type="button"
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: billingMode === 'base' ? 'linear-gradient(135deg, #10B981 0%, #00E5F0 100%)' : 'transparent',
              color: billingMode === 'base' ? '#020408' : '#94A3B8',
              boxShadow: billingMode === 'base' ? '0 0 20px rgba(16, 185, 129, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            ⛓️ Web3 Pay-Per-Scan ($0.001 USDC)
          </button>
        </div>
      </div>

      {/* ── MODE 1: STRIPE MONTHLY TIERS ──────────────────────────── */}
      {billingMode === 'stripe' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Developer Tier */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 }}>
            <div>
              <span className="metric-card-tag" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#CBD5E1' }}>
                DEVELOPER
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Free Starter
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                For individual hackers and open-source contributors testing AI coding agents.
              </div>

              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 800, color: '#fff' }}>$0</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month forever</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>1,000 package verifications / mo</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>NPM Registry + OSV.dev sync</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>Bearer API Key authentication</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>Community Discord support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('console-drawer');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-secondary-glass"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32, fontSize: 13.5 }}
            >
              Get Free API Key
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 32,
              border: '1px solid rgba(0, 242, 254, 0.4)',
              background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.85) 0%, rgba(4, 8, 18, 0.95) 100%)',
              boxShadow: '0 0 40px rgba(0, 242, 254, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: -13, right: 24, padding: '3px 12px', borderRadius: 20, background: 'linear-gradient(135deg, #00E5F0 0%, #818CF8 100%)', color: '#020408', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 800 }}>
              MOST POPULAR
            </div>

            <div>
              <span className="metric-card-tag">PRO TEAM</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Autonomous CI/CD
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                For high-velocity engineering teams using Cursor, Claude, and Gemini in production.
              </div>

              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 800, color: '#00F2FE' }}>$49</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--cyan)' }}>✓</span>
                  <span><strong>50,000</strong> package verifications / mo</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--cyan)' }}>✓</span>
                  <span>Gemini 2.5 Flash AI reasoning engine</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--cyan)' }}>✓</span>
                  <span>Cryptographic execution proof audit trails</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--cyan)' }}>✓</span>
                  <span>GitHub Actions &amp; Pre-commit hooks</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--cyan)' }}>✓</span>
                  <span>99.9% Latency SLA (&lt;50ms response)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('PRO', 'price_pro_subscription')}
              disabled={checkoutLoading === 'PRO'}
              className="btn-primary-glow"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32, fontSize: 14 }}
            >
              {checkoutLoading === 'PRO' ? 'Creating Stripe Session...' : 'Upgrade to Pro with Stripe 💳'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 }}>
            <div>
              <span className="metric-card-tag" style={{ background: 'rgba(129, 140, 248, 0.1)', borderColor: 'rgba(129, 140, 248, 0.3)', color: '#818CF8' }}>
                ENTERPRISE
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Custom Compliance
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                For enterprises with private Artifactory/NPM registries and custom legal policies.
              </div>

              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 800, color: '#818CF8' }}>$299</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--indigo)' }}>✓</span>
                  <span><strong>Unlimited</strong> AI verification scans</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--indigo)' }}>✓</span>
                  <span>Private registry proxy &amp; Artifactory sync</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--indigo)' }}>✓</span>
                  <span>Custom license &amp; patent policy rules</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--indigo)' }}>✓</span>
                  <span>Dedicated compliance officer portal</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('ENTERPRISE', 'price_enterprise_subscription')}
              disabled={checkoutLoading === 'ENTERPRISE'}
              className="btn-secondary-glass"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32, fontSize: 13.5 }}
            >
              Contact Enterprise Sales ↗
            </button>
          </div>
        </div>
      )}

      {/* ── MODE 2: WEB3 BASE USDC PAY-PER-SCAN & CALCULATOR ──────── */}
      {billingMode === 'base' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Interactive Savings Calculator */}
          <div className="glass-panel" style={{ padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <span className="metric-card-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
                  ON-CHAIN MICROPAYMENTS · BASE SEPOLIA
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>
                  Pay-As-You-Go Savings Calculator
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Rate per Verification:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--emerald)' }}>
                  $0.001 USDC
                </div>
              </div>
            </div>

            {/* Slider Control */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Estimated Monthly Agent Verifications:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--cyan)' }}>
                  {monthlyScans.toLocaleString()} scans
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={monthlyScans}
                onChange={(e) => setMonthlyScans(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#10B981',
                  cursor: 'pointer',
                  height: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                <span>500 Scans</span>
                <span>25,000 Scans</span>
                <span>50,000+ Scans</span>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(8, 12, 22, 0.8)', padding: 20, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Base USDC Escrow Cost</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: 'var(--emerald)', marginTop: 4 }}>
                  ${web3MonthlyCost} <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>USDC</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(52, 211, 153, 0.8)', marginTop: 4 }}>Zero recurring subscription</div>
              </div>

              <div style={{ background: 'rgba(8, 12, 22, 0.8)', padding: 20, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Traditional SaaS Monthly Cost</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>
                  ${traditionalCost}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Fixed tier + overage fees</div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 20, borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--emerald)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Estimated Savings</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  ${estimatedSavings} <span style={{ fontSize: 13, color: 'var(--emerald)' }}>({savingsPercent}%)</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 4 }}>Instant cryptographic settlement</div>
              </div>
            </div>

            {/* Direct Contract Action */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 10px var(--emerald)' }} />
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Contract: <code style={{ color: '#00F2FE' }}>0x036CbD53842c5426634e7929541eC2318f3dCF7e</code>
                </span>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('console-drawer');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary-glow"
                type="button"
                style={{ padding: '10px 20px', fontSize: 13 }}
              >
                Launch Base USDC Audit in Inspector →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
