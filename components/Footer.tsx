'use client';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="brand-name">LicenseShield</span>
              <span className="brand-badge">AI</span>
            </div>
            <p className="footer-tagline">
              Autonomous AI agent for open-source license compliance and CVE security auditing.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><a href="/">Audit Engine</a></li>
                <li><a href="/vault">License Vault</a></li>
                <li><a href="/reports">Reports</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Protocol</h4>
              <ul>
                <li>
                  <a 
                    href="https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e" 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Base Sepolia USDC Escrow
                  </a>
                </li>
                <li><a href="https://osv.dev" target="_blank" rel="noreferrer">OSV.dev Vulnerability DB</a></li>
                <li><a href="https://registry.npmjs.org" target="_blank" rel="noreferrer">NPM Registry API</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>AI Engine</h4>
              <ul>
                <li><span>Google Gemini 2.5 / 3.5 Flash</span></li>
                <li><span>Strict JSON Schema Output</span></li>
                <li><span>Deterministic Fallback Matrix</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copyright">© 2026 LicenseShield AI. All rights reserved.</span>
          <div className="footer-pills">
            <span className="pill">Base Sepolia Chain ID 84532</span>
            <span className="pill">$0.01 USDC Escrow</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
