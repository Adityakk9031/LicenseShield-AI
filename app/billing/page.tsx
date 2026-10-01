'use client';

import { useState } from 'react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

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

  const handleSubscribe = async (tier: 'PRO' | 'ENTERPRISE') => {
    if (loadingPriceId) return;
    setLoadingPriceId(tier);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Checkout failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      alert(`Checkout could not start: ${err?.message || 'unknown error'}`);
    } finally {
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
    'Gemini 3.5 Flash AI Engine',
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
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="billing-card w-full h-auto flex flex-col justify-between" style={{ height: 'auto' }}>
            <div className="billing-card-inner">
              <CardItem translateZ={30} className="w-full">
              <p className="billing-tier-name">Free</p>
              </CardItem>
              <CardItem translateZ={80} className="w-full">
              <div className="billing-price">
                <span className="billing-price-amount">$0</span>
                <span className="billing-price-period">/month</span>
              </div>
              </CardItem>
              <p className="billing-description">100 scans per month</p>
              <hr className="billing-divider" />
              <CardItem translateZ={20} className="w-full">
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
              </CardItem>
            </div>
            <CardItem translateZ={40} className="w-full">
            <a
              href="/dashboard"
              className="btn-ghost billing-cta"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Current Plan
            </a>
            </CardItem>
          </CardBody>
          </CardContainer>

          {/* PRO CARD */}
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="billing-card featured w-full h-auto flex flex-col justify-between" style={{ height: 'auto' }}>
            <div className="billing-popular-badge">Most Popular</div>
            <div className="billing-card-inner">
              <CardItem translateZ={30} className="w-full">
              <p className="billing-tier-name">Pro</p>
              </CardItem>
              <CardItem translateZ={80} className="w-full">
              <div className="billing-price">
                <span className="billing-price-amount">$29</span>
                <span className="billing-price-period">/month</span>
              </div>
              </CardItem>
              <p className="billing-description">Everything you need to ship fast</p>
              <hr className="billing-divider" />
              <CardItem translateZ={20} className="w-full">
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
              </CardItem>
            </div>
            <CardItem translateZ={40} className="w-full">
            <button
              className="btn-brand billing-cta"
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('PRO')}
              disabled={loadingPriceId === 'PRO'}
            >
              {loadingPriceId === 'PRO'
                ? 'Redirecting...'
                : 'Upgrade to Pro'}
            </button>
            </CardItem>
          </CardBody>
          </CardContainer>

          {/* ENTERPRISE CARD */}
          <CardContainer containerClassName="py-0 w-full h-full" className="w-full h-full">
          <CardBody className="billing-card w-full h-auto flex flex-col justify-between" style={{ height: 'auto' }}>
            <div className="billing-card-inner">
              <CardItem translateZ={30} className="w-full">
              <p className="billing-tier-name">Enterprise</p>
              </CardItem>
              <CardItem translateZ={80} className="w-full">
              <div className="billing-price">
                <span className="billing-price-amount">$199</span>
                <span className="billing-price-period">/month</span>
              </div>
              </CardItem>
              <p className="billing-description">For teams with custom compliance needs</p>
              <hr className="billing-divider" />
              <CardItem translateZ={20} className="w-full">
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
              </CardItem>
            </div>
            <CardItem translateZ={40} className="w-full">
            <button
              className="btn-emerald billing-cta"
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('ENTERPRISE')}
              disabled={loadingPriceId === 'ENTERPRISE'}
            >
              {loadingPriceId === 'ENTERPRISE'
                ? 'Redirecting...'
                : 'Upgrade to Enterprise'}
            </button>
            </CardItem>
          </CardBody>
          </CardContainer>

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
          background:
            radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99, 102, 241, 0.07) 0%, transparent 60%),
            #F2F4FC;
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
          color: #6D28D9;
          background: rgba(109, 40, 217, 0.06);
          border: 1px solid rgba(109, 40, 217, 0.2);
          padding: 6px 14px;
          border-radius: 999px;
        }

        .billing-title {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: #0F172A;
        }

        .billing-subtitle {
          margin: 0;
          font-size: 1rem;
          color: #64748B;
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
          background: #FFFFFF;
          border: 1px solid #E9ECF7;
          border-radius: 20px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 32px rgba(99, 102, 241, 0.06);
          transition: border-color 0.25s ease, transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .billing-card:hover {
          border-color: rgba(99, 102, 241, 0.35);
          transform: translateY(-4px);
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05), 0 18px 44px rgba(99, 102, 241, 0.13);
        }

        .billing-card.featured {
          border-color: rgba(99, 102, 241, 0.45);
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05), 0 20px 56px rgba(99, 102, 241, 0.16);
          transform: scale(1.03);
          z-index: 1;
        }

        .billing-card.featured:hover {
          transform: scale(1.03) translateY(-4px);
          box-shadow: 0 4px 8px rgba(15, 23, 42, 0.06), 0 28px 68px rgba(99, 102, 241, 0.22);
        }

        .billing-popular-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 16px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
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
          color: #64748B;
        }

        .billing-card.featured .billing-tier-name {
          color: #6D28D9;
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
          color: #0F172A;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .billing-price-period {
          font-size: 0.875rem;
          color: #94A3B8;
          font-weight: 500;
        }

        .billing-description {
          margin: 0;
          font-size: 0.875rem;
          color: #64748B;
          line-height: 1.5;
        }

        .billing-divider {
          border: none;
          border-top: 1px solid #EEF1F9;
          margin: 4px 0;
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
          color: #334155;
          line-height: 1.4;
        }

        .billing-feature-check {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366F1;
        }

        .billing-feature-check.featured-check {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          border-color: transparent;
          color: #FFFFFF;
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
          background: #F8FAFF;
          border: 1px solid #DDE2F0;
          color: #64748B;
        }

        .billing-cta.btn-ghost:hover {
          background: #F1F4FC;
          color: #475569;
          border-color: #C7CFE6;
        }

        .billing-cta.btn-brand {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        .billing-cta.btn-brand:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f52e8 0%, #7c4df0 100%);
          box-shadow: 0 10px 28px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .billing-cta.btn-brand:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .billing-cta.btn-emerald {
          background: rgba(5, 150, 105, 0.06);
          border: 1px solid rgba(5, 150, 105, 0.3);
          color: #059669;
        }

        .billing-cta.btn-emerald:hover:not(:disabled) {
          background: rgba(5, 150, 105, 0.12);
          border-color: rgba(5, 150, 105, 0.5);
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.15);
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
          color: #94A3B8;
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
          color: #64748B;
          background: #FFFFFF;
          border: 1px solid #E9ECF7;
          padding: 6px 14px;
          border-radius: 999px;
          letter-spacing: 0.01em;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .billing-global-chip:hover {
          color: #6D28D9;
          border-color: rgba(109, 40, 217, 0.3);
          background: rgba(109, 40, 217, 0.04);
        }
      `}</style>
    </div>
  );
}
