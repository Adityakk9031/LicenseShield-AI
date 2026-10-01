'use client';

import { useState } from 'react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

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

  const handleStripeCheckout = async (planTier: 'PRO' | 'ENTERPRISE') => {
    setCheckoutLoading(planTier);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planTier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Checkout could not start: ${data.error || 'no checkout URL returned'}`);
      }
    } catch (err: any) {
      alert(`Checkout could not start: ${err?.message || 'network error'}`);
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
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(27px, 3.3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.038em', lineHeight: 1.12, textWrap: 'balance' }}>
          Dual-Settlement <span className="hero-heading-gradient">Pricing Architecture</span>
        </h2>
        <p style={{ fontSize: 'clamp(14.5px, 1.4vw, 16px)', color: 'rgba(148, 163, 184, 0.9)', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.65 }}>
          Choose between traditional Web2 SaaS monthly subscriptions or frictionless Web3 pay-per-scan micro-settlements on Base Sepolia.
        </p>

        {/* Dual Mode Switcher Pill */}
        <div style={{ display: 'inline-flex', background: 'rgba(10, 12, 20, 0.85)', padding: 5, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 32, backdropFilter: 'blur(20px)' }}>
          <button
            onClick={() => setBillingMode('stripe')}
            type="button"
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: billingMode === 'stripe' ? '#6366F1' : 'transparent',
              color: billingMode === 'stripe' ? '#FFFFFF' : '#94A3B8',
              boxShadow: billingMode === 'stripe' ? '0 8px 20px -8px rgba(99, 102, 241, 0.6)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Web2 SaaS (Stripe Monthly)
          </button>
          <button
            onClick={() => setBillingMode('base')}
            type="button"
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: billingMode === 'base' ? '#6366F1' : 'transparent',
              color: billingMode === 'base' ? '#FFFFFF' : '#94A3B8',
              boxShadow: billingMode === 'base' ? '0 8px 20px -8px rgba(99, 102, 241, 0.6)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Web3 Pay-Per-Scan ($0.01 USDC)
          </button>
        </div>
      </div>

      {/* ── MODE 1: STRIPE MONTHLY TIERS ──────────────────────────── */}
      {billingMode === 'stripe' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          {/* Developer Tier */}
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="glass-panel w-full h-auto flex flex-col justify-between">
            <div>
              <CardItem translateZ={30} className="w-full">
              <span className="metric-card-tag" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#CBD5E1' }}>
                DEVELOPER
              </span>
              </CardItem>
              <CardItem translateZ={45} className="w-full">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Free Starter
              </div>
              </CardItem>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                100 scans per month — for individual hackers and open-source contributors.
              </div>

              <CardItem translateZ={90} className="w-full">
              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#fff' }}>$0</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month forever</span>
              </div>
              </CardItem>

              <CardItem translateZ={25} className="w-full">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>100 scans / month</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>Basic License Compatibility</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>OSV Vulnerability Scans</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>Community Support</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>API Key Access</span>
                </li>
              </ul>
              </CardItem>
            </div>

            <CardItem translateZ={50} className="w-full">
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
            </CardItem>
          </CardBody>
          </CardContainer>

          {/* Pro Tier (Featured) */}
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="glass-panel pricing-featured w-full h-auto flex flex-col justify-between">
            <div style={{ position: 'absolute', top: -13, right: 24, padding: '4px 12px', borderRadius: 20, background: '#6366F1', color: '#FFFFFF', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', zIndex: 30 }}>
              MOST POPULAR
            </div>

            <div>
              <CardItem translateZ={30} className="w-full">
              <span className="metric-card-tag">PRO TEAM</span>
              </CardItem>
              <CardItem translateZ={45} className="w-full">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Pro
              </div>
              </CardItem>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                Everything you need to ship fast.
              </div>

              <CardItem translateZ={90} className="w-full">
              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#fff' }}>$29</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month</span>
              </div>
              </CardItem>

              <CardItem translateZ={25} className="w-full">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span><strong>10,000</strong> scans / month</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Gemini 2.5 Flash AI Engine</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Dedicated API Key</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Audit Log History (90d)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Priority Support</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Webhook Notifications</span>
                </li>
              </ul>
              </CardItem>
            </div>

            <CardItem translateZ={50} className="w-full">
            <button
              onClick={() => handleStripeCheckout('PRO')}
              disabled={checkoutLoading === 'PRO'}
              className="btn-primary-glow"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32, fontSize: 14 }}
            >
              {checkoutLoading === 'PRO' ? 'Creating Stripe Session...' : 'Upgrade to Pro with Stripe 💳'}
            </button>
            </CardItem>
          </CardBody>
          </CardContainer>

          {/* Enterprise Tier */}
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="glass-panel w-full h-auto flex flex-col justify-between">
            <div>
              <CardItem translateZ={30} className="w-full">
              <span className="metric-card-tag" style={{ background: 'rgba(129, 140, 248, 0.08)', borderColor: 'rgba(129, 140, 248, 0.28)', color: '#A5B4FC' }}>
                ENTERPRISE
              </span>
              </CardItem>
              <CardItem translateZ={45} className="w-full">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 }}>
                Enterprise
              </div>
              </CardItem>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                For teams with custom compliance needs.
              </div>

              <CardItem translateZ={90} className="w-full">
              <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#fff' }}>$199</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/ month</span>
              </div>
              </CardItem>

              <CardItem translateZ={25} className="w-full">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#E2E8F0', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span><strong>Unlimited</strong> scans</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Custom License Rules</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Multiple API Keys (10)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>Dedicated SLA</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>SBOM Export</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#A5B4FC' }}>✓</span>
                  <span>On-chain Audit Trail</span>
                </li>
              </ul>
              </CardItem>
            </div>

            <CardItem translateZ={50} className="w-full">
            <button
              onClick={() => handleStripeCheckout('ENTERPRISE')}
              disabled={checkoutLoading === 'ENTERPRISE'}
              className="btn-secondary-glass"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32, fontSize: 13.5 }}
            >
              Contact Enterprise Sales ↗
            </button>
            </CardItem>
          </CardBody>
          </CardContainer>
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
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  $0.01 USDC
                </div>
              </div>
            </div>

            {/* Slider Control */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Estimated Monthly Agent Verifications:
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
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
                  accentColor: '#6366F1',
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
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Base USDC Escrow Cost</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  ${web3MonthlyCost} <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>USDC</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Zero recurring subscription</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Traditional SaaS Monthly Cost</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  ${traditionalCost}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Fixed tier + overage fees</div>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 20, borderRadius: 14, border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                <div style={{ fontSize: 11.5, color: '#A5B4FC', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Estimated Savings</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  ${estimatedSavings} <span style={{ fontSize: 13, color: '#A5B4FC' }}>({savingsPercent}%)</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Instant cryptographic settlement</div>
              </div>
            </div>

            {/* Direct Contract Action */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Contract: <code style={{ color: '#A5B4FC' }}>0x036CbD53842c5426634e7929541eC2318f3dCF7e</code>
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
