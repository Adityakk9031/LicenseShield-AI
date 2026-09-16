'use client';

import { useState } from 'react';

interface OverlayHeroProps {
  onScrollToConsole: () => void;
  onScrollToSandbox?: () => void;
  onOpenKeyModal: () => void;
}

export default function OverlayHero({
  onScrollToConsole,
  onScrollToSandbox,
  onOpenKeyModal,
}: OverlayHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCLI = () => {
    navigator.clipboard.writeText('npx licenseshield-ai audit');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSandboxScroll = () => {
    if (onScrollToSandbox) {
      onScrollToSandbox();
    } else {
      const el = document.getElementById('agent-sandbox');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-container">
      {/* Verified Protocol Pill */}
      <div className="hero-pill">
        <span className="hero-pill-dot" />
        <span>Autonomous Guardrails for AI Coding Agents · Base Sepolia Escrow</span>
      </div>

      {/* Main Title with USP */}
      <h1 className="hero-heading">
        Real-Time Guardrails for <br />
        <span className="hero-heading-gradient">Autonomous AI Coding Agents</span>
      </h1>

      {/* Subtitle */}
      <p className="hero-subtext">
        Intercept AI-generated package dependencies in real-time. Detect copyleft license conflicts, CVE supply chain attacks, and verify compliance proofs before code merges into production.
      </p>

      {/* CLI Quick-Copy Command Bar */}
      <div className="hero-cli-bar">
        <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>$</span>
        <span className="hero-cli-code">npx licenseshield-ai audit</span>
        <button onClick={handleCopyCLI} className="hero-cli-copy" type="button">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Primary & Secondary Actions */}
      <div className="hero-buttons">
        <button onClick={handleSandboxScroll} className="btn-primary-glow" type="button">
          <span>⚡ Launch Agent Sandbox</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button onClick={onOpenKeyModal} className="btn-secondary-glass" type="button">
          <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>#</span>
          <span>Generate Live API Key</span>
        </button>
      </div>

      {/* Mini Feature Badges Row */}
      <div className="hero-pills-row">
        <div className="hero-feature-chip">
          <span style={{ color: '#00F2FE' }}>⚡</span>
          <span>&lt;50ms Intercept</span>
        </div>
        <div className="hero-feature-chip">
          <span style={{ color: '#10B981' }}>🛡️</span>
          <span>OSV.dev + NPM Synced</span>
        </div>
        <div className="hero-feature-chip">
          <span style={{ color: '#818CF8' }}>🤖</span>
          <span>Cursor / Claude / Gemini Guardrails</span>
        </div>
        <div className="hero-feature-chip">
          <span style={{ color: '#F59E0B' }}>⛓️</span>
          <span>Base Sepolia $0.001 Escrow</span>
        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <div className="scroll-indicator">
        <span>Scroll to Explore Agent Interceptor</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
