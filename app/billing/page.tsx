'use client';

import { useState } from 'react';

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 7L5.5 10L11.5 4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function BillingPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (loadingPriceId) return;
    setLoadingPriceId(priceId);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        throw new Error(`Checkout failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setLoadingPriceId(null);
    }
  };

  const freeFeatures = [
    '100 scans / month',
    'Basic License Compatibility',
    'OSV Vulnerability Scans',
    'Community Support',
    'API Key Access',
  ];

  const proFeatures = [
    '10,000 scans / month',
    'Gemini 2.5 Flash AI Engine',
    'Dedicated API Key',
    'Audit Log History (90d)',
    'Priority Support',
    'Webhook Notifications',
  ];

  const enterpriseFeatures = [
    'Unlimited Scans',
    'Custom License Rules',
    'Multiple API Keys (10)',
    'Dedicated SLA',
    'SBOM Export',
    'On-chain Audit Trail',
  ];

  const globalBadges = [
    'OSV.dev Integration',
    'Base Sepolia Escrow',
    'Gemini AI Analysis',
    'REST API Access',
  ];

  return (
    <div className="billing-page">
      <div className="billing-container">

        {/* Header */}
        <header className="billing-header">
          <span className="billing-eyebrow">💎 Developer Plans</span>
          <h1 className="billing-title">Simple, transparent pricing</h1>
          <p className="billing-subtitle">
            Choose the plan that fits your workflow. Upgrade or downgrade anytime —
            no lock-in, no surprises.
          </p>
        </header>

        {/* Pricing Grid */}
        <div className="billing-grid">

          {/* FREE CARD */}
          <div className="billing-card">
            <div className="billing-card-inner">
              <p className="billing-tier-name">Free</p>
              <div className="billing-price">
                <span className="billing-price-amount">$0</span>
                <span className="billing-price-period">/month</span>
              </div>
              <p className="billing-description">100 scans per month</p>
              <hr className="billing-divider" />
              <ul className="billing-features">
                {freeFeatures.map((feat) => (
                  <li key={feat} className="billing-feature">
                    <div className="billing-feature-check">
                      <CheckIcon />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/dashboard"
              className="btn-ghost billing-cta"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Current Plan
            </a>
          </div>

          {/* PRO CARD */}
          <div className="billing-card featured">
            <div className="billing-popular-badge">Most Popular</div>
            <div className="billing-card-inner">
              <p className="billing-tier-name">Pro</p>
              <div className="billing-price">
                <span className="billing-price-amount">$29</span>
                <span className="billing-price-period">/month</span>
              </div>
              <p className="billing-description">Everything you need to ship fast</p>
              <hr className="billing-divider" />
              <ul className="billing-features">
                {proFeatures.map((feat) => (
                  <li key={feat} className="billing-feature">
                    <div className="billing-feature-check featured-check">
                      <CheckIcon />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn-brand billing-cta"
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('price_test_demo_pro_tier')}
              disabled={loadingPriceId === 'price_test_demo_pro_tier'}
            >
              {loadingPriceId === 'price_test_demo_pro_tier'
                ? 'Redirecting...'
                : 'Upgrade to Pro'}
            </button>
          </div>

          {/* ENTERPRISE CARD */}
          <div className="billing-card">
            <div className="billing-card-inner">
              <p className="billing-tier-name">Enterprise</p>
              <div className="billing-price">
                <span className="billing-price-amount">$199</span>
                <span className="billing-price-period">/month</span>
              </div>
              <p className="billing-description">For teams with custom compliance needs</p>
              <hr className="billing-divider" />
              <ul className="billing-features">
                {enterpriseFeatures.map((feat) => (
                  <li key={feat} className="billing-feature">
                    <div className="billing-feature-check">
                      <CheckIcon />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn-emerald billing-cta"
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('price_test_demo_enterprise_tier')}
              disabled={loadingPriceId === 'price_test_demo_enterprise_tier'}
            >
              {loadingPriceId === 'price_test_demo_enterprise_tier'
                ? 'Redirecting...'
                : 'Upgrade to Enterprise'}
            </button>
          </div>

        </div>

        {/* All Plans Include */}
        <div className="billing-global-section">
          <p className="billing-global-label">All plans include</p>
          <div className="billing-global-badges">
            {globalBadges.map((badge) => (
              <span key={badge} className="billing-global-chip">
                {badge}
              </span>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .billing-page {
          min-height: 100vh;
          background: radial-gradient(ellipse 80% 60% at 50% -10%,
              rgba(99, 102, 241, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%,
              rgba(16, 185, 129, 0.10) 0%, transparent 55%),
            #0a0a0f;
          padding: 80px 24px 100px;
          display: flex;
          justify-content: center;
        }

        .billing-container {
          width: 100%;
          max-width: 1120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 64px;
        }

        .billing-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 620px;
        }

        .billing-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 6px 14px;
          border-radius: 999px;
        }

        .billing-title {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .billing-subtitle {
          margin: 0;
          font-size: 1rem;
          color: #64748b;
          line-height: 1.7;
        }

        .billing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
          align-items: start;
        }

        @media (max-width: 900px) {
          .billing-grid {
            grid-template-columns: 1fr;
            max-width: 420px;
            margin: 0 auto;
          }
        }

        .billing-card {
          position: relative;
          background: rgba(15, 15, 25, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 32px 28px 28px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          gap: 24px;
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }

        .billing-card:hover {
          border-color: rgba(99, 102, 241, 0.28);
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.12);
        }

        .billing-card.featured {
          background: rgba(20, 18, 48, 0.75);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.18), 0 20px 60px rgba(99, 102, 241, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transform: scale(1.03);
          z-index: 1;
        }

        .billing-card.featured:hover {
          transform: scale(1.03) translateY(-4px);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.35), 0 28px 70px rgba(99, 102, 241, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .billing-popular-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 16px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
        }

        .billing-card-inner {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .billing-tier-name {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .billing-card.featured .billing-tier-name {
          color: #a5b4fc;
        }

        .billing-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin: 4px 0;
        }

        .billing-price-amount {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f8fafc;
          line-height: 1;
        }

        .billing-price-period {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 500;
        }

        .billing-description {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
        }

        .billing-card.featured .billing-description {
          color: #94a3b8;
        }

        .billing-divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin: 4px 0;
        }

        .billing-card.featured .billing-divider {
          border-top-color: rgba(99, 102, 241, 0.2);
        }

        .billing-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .billing-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        .billing-card.featured .billing-feature {
          color: #cbd5e1;
        }

        .billing-feature-check {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .billing-feature-check.featured-check {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.35);
          color: #a5b4fc;
        }

        .billing-cta {
          flex-shrink: 0;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }

        .billing-cta.btn-ghost {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #64748b;
        }

        .billing-cta.btn-ghost:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #94a3b8;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .billing-cta.btn-brand {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          color: #fff;
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.38);
        }

        .billing-cta.btn-brand:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f52e8 0%, #6d77f5 100%);
          box-shadow: 0 10px 32px rgba(99, 102, 241, 0.5);
          transform: translateY(-1px);
        }

        .billing-cta.btn-brand:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .billing-cta.btn-emerald {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
        }

        .billing-cta.btn-emerald:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.18);
          transform: translateY(-1px);
        }

        .billing-cta.btn-emerald:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .billing-global-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .billing-global-label {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
        }

        .billing-global-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .billing-global-chip {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 14px;
          border-radius: 999px;
          letter-spacing: 0.01em;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .billing-global-chip:hover {
          color: #94a3b8;
          border-color: rgba(99, 102, 241, 0.2);
          background: rgba(99, 102, 241, 0.05);
        }
      `}</style>
    </div>
  );
}
