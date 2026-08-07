'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div className="navbar-brand-text">
            <span className="brand-name">LicenseShield</span>
            <span className="brand-badge">AI</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Audit Engine
          </Link>
          <Link href="/vault" className={`nav-link ${pathname === '/vault' ? 'active' : ''}`}>
            License Vault
          </Link>
          <Link href="/reports" className={`nav-link ${pathname === '/reports' ? 'active' : ''}`}>
            Reports
          </Link>
        </nav>
      </div>

      <div className="navbar-actions">
        <div className="net-status-badge">
          <span className="status-dot"></span>
          <span className="net-text">Base Sepolia</span>
        </div>

        <div className="auth-model-pill">
          <span className="pill-dot"></span>
          <span className="pill-text">USDC Escrow / API Key</span>
        </div>

        <a 
          href="https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e" 
          target="_blank" 
          rel="noreferrer"
          className="btn-contract-link"
        >
          <span>Contract</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </header>
  );
}
