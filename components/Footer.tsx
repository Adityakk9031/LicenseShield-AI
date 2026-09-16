'use client';

import BrandLogo from './ui/BrandLogo';

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '64px 32px 44px',
        background: 'transparent',
      }}
    >
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 44, marginBottom: 52, textAlign: 'left' }}>
          <div style={{ maxWidth: 380 }}>
            <div style={{ marginBottom: 16 }}>
              <BrandLogo size="md" />
            </div>
            <p style={{ fontSize: 14, color: 'rgba(148, 163, 184, 0.85)', lineHeight: 1.65 }}>
              Autonomous open-source security &amp; license intelligence engine, settled via Base Sepolia Smart Contract Escrow.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Platform
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                <li>
                  <a href="#metrics" style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                    Live Telemetry
                  </a>
                </li>
                <li>
                  <a href="#console-drawer" style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                    Audit Inspector
                  </a>
                </li>
                <li>
                  <a href="https://osv.dev" target="_blank" rel="noreferrer" style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                    OSV.dev Vulnerability DB ↗
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Smart Contract
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                <li>
                  <a
                    href="https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}
                  >
                    Base Sepolia Escrow ↗
                  </a>
                </li>
                <li>
                  <a href="https://registry.npmjs.org" target="_blank" rel="noreferrer" style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                    NPM Registry API ↗
                  </a>
                </li>
                <li>
                  <a href="https://base.org" target="_blank" rel="noreferrer" style={{ color: 'rgba(148, 163, 184, 0.8)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                    Base Network ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(100, 116, 139, 0.8)' }}>
            © 2026 LicenseShield AI · Autonomous Security System
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                padding: '5px 14px',
                borderRadius: 24,
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10B981',
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontWeight: 600,
              }}
            >
              ● Base Sepolia 84532
            </span>
            <span
              style={{
                padding: '5px 14px',
                borderRadius: 24,
                background: 'rgba(0, 242, 254, 0.06)',
                color: '#00F2FE',
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                border: '1px solid rgba(0, 242, 254, 0.18)',
                fontWeight: 600,
              }}
            >
              $0.01 USDC Escrow
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
