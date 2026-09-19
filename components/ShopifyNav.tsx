'use client';

import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function ShopifyNav() {
  const [editionsOpen, setEditionsOpen] = useState(false);

  return (
    <nav className="editions-nav">
      {/* Left: Logo */}
      <div className="nav-logo-block">
        <div className="nav-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L8 6H4L2 10L4 14L2 18L6 20H10L12 22L14 20H18L22 18L20 14L22 10L20 6H16L12 2Z"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="nav-brand-text">
            LicenseShield
            <span className="nav-brand-edition"> | Winter '26</span>
          </div>
          <span className="nav-badge">AI Security</span>
        </div>
      </div>

      {/* Center: Editions + Search */}
      <div className="nav-center">
        <button
          className="nav-editions-btn"
          onClick={() => {
            const el = document.getElementById('operations');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Run Audit</span>
          <ChevronDown size={14} strokeWidth={2} />
        </button>
        <button
          className="nav-search-btn"
          onClick={() => {
            const el = document.getElementById('developer');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>API Docs</span>
          <Search size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Right: Site link + CTA */}
      <div className="nav-right">
        <a
          href="https://github.com/Adityakk9031/LicenseShield-AI"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-site-link"
        >
          GitHub
        </a>
        <button
          className="nav-cta-btn"
          onClick={() => {
            const el = document.getElementById('operations');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Start Audit
        </button>
      </div>
    </nav>
  );
}
