'use client';

import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { id: 'hero',       label: 'Overview',      numeral: 'I' },
  { id: 'gemini',     label: 'Gemini AI',     numeral: 'II' },
  { id: 'agentic',    label: 'AI Agent',      numeral: 'III' },
  { id: 'payment',    label: 'Hybrid Pay',    numeral: 'IV' },
  { id: 'operations', label: 'Audit Console', numeral: 'V' },
  { id: 'settlement', label: 'Base Escrow',   numeral: 'VI' },
  { id: 'developer',  label: 'API Docs',      numeral: 'VII' },
];

export default function RenaissanceSidebar() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY;
      const winH = window.innerHeight;
      const idx = Math.floor((scrollY + winH * 0.3) / (winH * 0.8));
      const clamped = Math.min(Math.max(0, idx), NAV_ITEMS.length - 1);
      setActive(NAV_ITEMS[clamped].id);
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <aside className="ren-sidebar">
      {/* Logo Block */}
      <div className="ren-sidebar-logo">
        <div className="ren-sidebar-logo-text">
          The Ren<em>a</em>issance<br />Edition
        </div>
        <div className="ren-sidebar-logo-sub">LicenseShield AI · Winter &#39;26</div>
      </div>

      {/* Navigation */}
      <nav className="ren-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`ren-nav-item${active === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span className="ren-nav-label">{item.label}</span>
            <span className="ren-nav-dots" />
            <span className="ren-nav-numeral">{item.numeral}</span>
          </button>
        ))}
      </nav>

      {/* Footer: Contract status */}
      <div className="ren-sidebar-footer">
        <div className="ren-sidebar-contract">
          <div className="ren-contract-label">Escrow Contract</div>
          <div className="ren-contract-status">
            <span className="ren-status-dot" />
            <span className="ren-contract-addr">0x036CbD...dCF7e</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>
            Base Sepolia · $0.01 USDC
          </div>
        </div>
      </div>
    </aside>
  );
}
