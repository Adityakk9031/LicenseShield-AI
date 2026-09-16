'use client';

import { useState } from 'react';

export default function PricingCalculator() {
  const [monthlyScans, setMonthlyScans] = useState(2500);

  const modelACost = 29;
  const modelBCost = Math.max(0.01, (monthlyScans * 0.01)).toFixed(2);

  return (
    <section id="pricing" className="pricing-section">
      <div>
        <div style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand-purple)', fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          Flexible SaaS &amp; Web3 Pricing
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>
          Plans that scale with your code
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px' }}>
          Choose between traditional Web2 SaaS API subscription keying or instant Web3 micro-escrow pay-per-scan on Base Sepolia.
        </p>

        {/* Interactive Volume Slider */}
        <div style={{ maxWidth: 640, margin: '0 auto 48px', padding: 28, background: 'var(--bg-surface-1)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Monthly Audits:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--brand-cyan)' }}>
              {monthlyScans.toLocaleString()} scans / mo
            </span>
          </div>

          <input
            type="range"
            min="100"
            max="20000"
            step="100"
            value={monthlyScans}
            onChange={(e) => setMonthlyScans(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand-purple)', cursor: 'pointer', height: 8 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: 'var(--text-tertiary)' }}>
            <span>100 Scans</span>
            <span>10,000 Scans</span>
            <span>20,000+ Scans</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid">
        {/* Model A Card */}
        <div className="pricing-card">
          <div>
            <span className="tag tag-indigo" style={{ marginBottom: 16 }}>MODEL A · WEB2 SAAS</span>
            <div className="price-title">API Key Subscription</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              For development teams building continuous CI/CD security pipelines.
            </div>

            <div className="price-amount-block">
              <span className="price-val">${modelACost}</span>
              <span className="price-unit">/ month</span>
            </div>

            <ul className="feature-list-checks">
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Unlimited npm dependency scans</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Persistent Bearer API key authentication</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Supabase / Prisma audit history storage</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>GitHub Actions CI/CD bot integration</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('console');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              width: '100%', padding: 14, borderRadius: 24, background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-medium)', color: '#fff', fontSize: 14, fontWeight: 600
            }}
          >
            Start Model A Trial
          </button>
        </div>

        {/* Model B Featured Card */}
        <div className="pricing-card featured">
          <div className="pricing-popular-badge">WEB3 NATIVE</div>
          <div>
            <span className="tag tag-green" style={{ marginBottom: 16 }}>MODEL B · BASE SEPOLIA</span>
            <div className="price-title">Micro-Escrow Pay-per-Scan</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Zero account creation required. Pay on-chain per audit in USDC.
            </div>

            <div className="price-amount-block">
              <span className="price-val">${modelBCost}</span>
              <span className="price-unit">USDC / mo est.</span>
            </div>

            <ul className="feature-list-checks">
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>$0.01 USDC micro-fee per audit</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Base Sepolia smart contract escrow lock</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Instant cryptographically verified receipt</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>0 sign-up or credit card required</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('console');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              width: '100%', padding: 14, borderRadius: 24, background: 'var(--brand-purple)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 20px var(--brand-purple-glow)'
            }}
          >
            Lock $0.01 Escrow &amp; Audit
          </button>
        </div>

        {/* Enterprise Card */}
        <div className="pricing-card">
          <div>
            <span className="tag tag-gold" style={{ marginBottom: 16 }}>ENTERPRISE AGENT</span>
            <div className="price-title">Dedicated Infrastructure</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              For enterprise organizations with private npm registries &amp; custom SLAs.
            </div>

            <div className="price-amount-block">
              <span className="price-val">$299</span>
              <span className="price-unit">/ month</span>
            </div>

            <ul className="feature-list-checks">
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Private NPM registry proxy auditing</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Custom license compliance policy rules</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Dedicated AI throughput &amp; 99.9% SLA</span>
              </li>
              <li className="check-item">
                <span className="check-icon">✓</span>
                <span>Self-hosted Base Sepolia escrow node</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('console');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              width: '100%', padding: 14, borderRadius: 24, background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-medium)', color: '#fff', fontSize: 14, fontWeight: 600
            }}
          >
            Contact Enterprise Team
          </button>
        </div>
      </div>
    </section>
  );
}
