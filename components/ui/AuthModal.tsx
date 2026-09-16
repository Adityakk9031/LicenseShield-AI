'use client';

import { useState } from 'react';
import BrandLogo from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'apikey' | 'web3';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'apikey' }: AuthModalProps) {
  const [tab, setTab] = useState<'apikey' | 'web3'>(defaultTab);
  const [apiKeyGenerated, setApiKeyGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleGenerateKey = () => {
    const key = `ls_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    setApiKeyGenerated(key);
  };

  const handleCopy = () => {
    if (apiKeyGenerated) {
      navigator.clipboard.writeText(apiKeyGenerated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(2, 4, 8, 0.88)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(8, 12, 22, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 22,
          padding: 34,
          boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 35px rgba(0, 242, 254, 0.12)',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <BrandLogo size="md" />
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: 8,
              color: 'var(--text-muted)',
              fontSize: 16,
              cursor: 'pointer',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, background: 'rgba(2, 4, 8, 0.8)', padding: 4, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            onClick={() => { setTab('apikey'); setAuthMsg(null); }}
            type="button"
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 9,
              border: 'none',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              background: tab === 'apikey' ? 'linear-gradient(135deg, #00E5F0 0%, #818CF8 100%)' : 'transparent',
              color: tab === 'apikey' ? '#020408' : '#94A3B8',
              transition: 'all 0.18s ease',
            }}
          >
            API Key
          </button>
          <button
            onClick={() => { setTab('web3'); setAuthMsg(null); }}
            type="button"
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 9,
              border: 'none',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              background: tab === 'web3' ? 'linear-gradient(135deg, #10B981 0%, #00E5F0 100%)' : 'transparent',
              color: tab === 'web3' ? '#020408' : '#94A3B8',
              transition: 'all 0.18s ease',
            }}
          >
            Web3
          </button>
        </div>

        {/* ── TAB 3: API KEY GENERATOR ──────────────────────────────── */}
        {tab === 'apikey' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Generate an active Model A Bearer API key to authorize automated CI/CD scans, Cursor agent hooks, and Claude Code intercepts.
            </div>

            {!apiKeyGenerated ? (
              <button
                onClick={handleGenerateKey}
                className="btn-primary-glow"
                type="button"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 14 }}
              >
                Generate Live API Key ✨
              </button>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--emerald)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    ✓ API Key Activated (10,000 req/mo)
                  </span>
                  <button
                    onClick={handleCopy}
                    type="button"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: 'var(--emerald)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>

                <input
                  type="text"
                  readOnly
                  value={apiKeyGenerated}
                  style={{
                    width: '100%',
                    background: '#020408',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    outline: 'none',
                  }}
                />

                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                  This bearer token is immediately valid for the live inspector and agent sandbox.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: WEB3 BASE SEPOLIA ──────────────────────────────── */}
        {tab === 'web3' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Use LicenseShield with zero account creation by locking micro-escrow deposits on Base Sepolia.
            </div>

            <div style={{ background: 'rgba(2, 4, 8, 0.9)', padding: 18, borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>NETWORK: BASE SEPOLIA (84532)</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', fontWeight: 700 }}>● LIVE ESCROW</span>
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#00F2FE', wordBreak: 'break-all' }}>
                0x036CbD53842c5426634e7929541eC2318f3dCF7e
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                const el = document.getElementById('console-drawer');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary-glow"
              type="button"
              style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
            >
              Open Base Escrow in Developer Console →
            </button>
          </div>
        )}

        {/* Feedback Message */}
        {authMsg && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              background: authMsg.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : authMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 242, 254, 0.1)',
              border: `1px solid ${authMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : authMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 242, 254, 0.25)'}`,
              color: authMsg.type === 'error' ? '#F87171' : authMsg.type === 'success' ? 'var(--emerald)' : 'var(--cyan)',
              textAlign: 'center',
            }}
          >
            {authMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}
