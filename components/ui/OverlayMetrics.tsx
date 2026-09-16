'use client';

import { useState } from 'react';

export default function OverlayMetrics() {
  const [copiedContract, setCopiedContract] = useState(false);
  const contractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const metrics = [
    { label: 'Total Packages Scanned', value: '142,890+', tag: 'NPM REGISTRY', desc: '+18.4% this week' },
    { label: 'AI Reasoning Latency', value: '420ms', tag: 'PIPELINE', desc: 'Gemini 2.5 Flash Engine' },
    { label: 'Vulnerabilities Triaged', value: '18,420', tag: 'SECURITY', desc: 'OSV Dev Database Synced' },
    { label: 'On-Chain Escrow Fees', value: '$0.01 USDC', tag: 'SETTLEMENT', desc: 'Base Sepolia Testnet' },
  ];

  return (
    <section className="metrics-section">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span className="metric-card-tag">REAL-TIME TELEMETRY</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginTop: 8 }}>
          Autonomous Compliance Metrics
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15.5, maxWidth: 580, margin: '10px auto 0', lineHeight: 1.6 }}>
          High-throughput vulnerability analysis and multi-license graph verification running across distributed nodes.
        </p>
      </div>

      {/* 4 Metrics Cards */}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <span className="metric-card-tag">{m.tag}</span>
            <div className="metric-card-val">{m.value}</div>
            <div className="metric-card-label">{m.label}</div>
            <div className="metric-card-desc">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Base Sepolia Verified Contract Card */}
      <div
        className="glass-panel"
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'rgba(16, 185, 129, 0.05)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            ⛓️
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              Base Sepolia Smart Contract Escrow
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 4, wordBreak: 'break-all' }}>
              {contractAddress}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleCopyContract}
            type="button"
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copiedContract ? '✓ Copied' : 'Copy Address'}
          </button>

          <a
            href={`https://sepolia.basescan.org/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--emerald)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            View on BaseScan ↗
          </a>
        </div>
      </div>
    </section>
  );
}
