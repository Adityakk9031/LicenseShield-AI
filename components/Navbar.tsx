'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import BrandLogo from './ui/BrandLogo';

interface NavbarProps {
  onOpenAuth?: (tab?: 'signin' | 'signup' | 'apikey' | 'web3') => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { isSignedIn, isLoaded } = useUser();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="nav-header">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <BrandLogo size="md" />
        </Link>

        {/* Nav Links */}
        <nav className="nav-links-row">
          <button onClick={() => scrollTo('agent-sandbox')} className="nav-link-btn" type="button">
            Agent Sandbox
          </button>
          <button onClick={() => scrollTo('metrics')} className="nav-link-btn" type="button">
            Telemetry
          </button>
          <button onClick={() => scrollTo('console-drawer')} className="nav-link-btn" type="button">
            Audit Inspector
          </button>
          <button onClick={() => scrollTo('pricing')} className="nav-link-btn" type="button">
            Pricing
          </button>
          <a
            href="https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            target="_blank"
            rel="noreferrer"
            className="nav-badge-contract"
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', boxShadow: '0 0 6px var(--emerald)' }} />
            <span>Base Sepolia Escrow ↗</span>
          </a>
        </nav>
      </div>

      {/* Action Buttons & Auth State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Signed In: Show Dashboard link + Avatar */}
        {isLoaded && isSignedIn && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--emerald)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '6px 14px',
                borderRadius: 20,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)' }} />
              <span>Dashboard</span>
            </Link>
            <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 32, height: 32 } } }} />
          </div>
        )}

        {/* Signed Out: Show Sign In + Sign Up */}
        {isLoaded && !isSignedIn && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SignInButton mode="modal">
              <button
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  padding: '8px 16px',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-sans)',
                }}
                type="button"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="btn-primary-glow"
                style={{ padding: '8px 16px', fontSize: 13 }}
                type="button"
              >
                Start Free →
              </button>
            </SignUpButton>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => scrollTo('agent-sandbox')}
          className="nav-cta-btn"
          type="button"
        >
          <span>⚡ Test Guardrails</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
