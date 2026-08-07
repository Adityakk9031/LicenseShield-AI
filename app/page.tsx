'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Risk { package: string; type: string; severity: string; detail: string; }
interface AuditVerdict {
  status: 'APPROVED' | 'FLAGGED';
  risks: Risk[];
  suggestions: string[];
  settlementTxHash?: string;
  aiAnalysis?: string;
}

export default function Home() {
  const [input, setInput] = useState('colors@1.4.1\nlodash@4.17.20\nreact@18.2.0');
  const [projectLicense, setProjectLicense] = useState('MIT');
  const [verdict, setVerdict] = useState<AuditVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  // Animated canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    let t = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const grid = 80;
      for (let x = 0; x < canvas.width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`; ctx.fill();
      });
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const gv = ctx.createRadialGradient(cx + Math.sin(t * 0.001) * 100, cy * 0.6, 0, cx, cy * 0.6, 500);
      gv.addColorStop(0, 'rgba(94,106,210,0.08)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gv; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const g2 = ctx.createRadialGradient(cx * 0.4, cy * 1.3, 0, cx * 0.4, cy * 1.3, 350);
      g2.addColorStop(0, 'rgba(5,177,105,0.05)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, canvas.width, canvas.height);
      t++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Scroll-driven parallax
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (heroRef.current) {
        const scale = Math.max(0.88, 1 - y * 0.0003);
        const tz = Math.min(0, -y * 0.12);
        const opacity = Math.max(0, 1 - y * 0.002);
        heroRef.current.style.transform = `perspective(1200px) translateZ(${tz}px) scale(${scale})`;
        heroRef.current.style.opacity = String(opacity);
      }
      document.querySelectorAll<HTMLElement>('.scroll-reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) el.classList.add('revealed');
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 3D mouse tilt on audit card
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.02)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerdict(null);
    const packages = input.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const i = l.lastIndexOf('@');
      return i > 0 ? { name: l.slice(0, i), version: l.slice(i + 1), ecosystem: 'npm' } : { name: l, ecosystem: 'npm' };
    });
    try {
      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ls_live_demo_key_998877' },
        body: JSON.stringify({ packages, projectLicense }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      await new Promise(r => setTimeout(r, 1200));
      setVerdict(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const STATS = [
    { v: '2.4M+', l: 'Packages indexed' },
    { v: 'OSV.dev', l: 'Vuln database' },
    { v: 'SPDX', l: 'License engine' },
    { v: '<3s', l: 'Avg scan time' },
  ];

  const STEPS = [
    { n: '01', title: 'Fetch Metadata', desc: 'Queries the NPM Registry API for package license declarations and version data in real-time.', icon: '📦', color: '#5e6ad2' },
    { n: '02', title: 'Scan Vulnerabilities', desc: 'Batch queries OSV.dev for known CVEs and security advisories across all your dependencies.', icon: '🔍', color: '#05b169' },
    { n: '03', title: 'Escrow Settlement', desc: 'Verdict is settled on-chain via LicenseShieldEscrow.sol on Base Sepolia testnet.', icon: '⛓', color: '#f4b000' },
  ];

  return (
    <div style={{ background: '#010102', minHeight: '100vh', overflowX: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* ── NAVBAR ─────────────────────────────── */}
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          LicenseShield AI
        </Link>

        <ul className="navbar-links">
          <li><a href="#audit">Audit</a></li>
          <li><Link href="/reports">Reports</Link></li>
          <li><Link href="/vault">Vault</Link></li>
          <li><Link href="/dashboard">Docs</Link></li>
        </ul>

        <div className="navbar-actions">
          <div className="navbar-badge">
            <span className="status-dot" />
            Base Sepolia Testnet
          </div>
          <Link href="/dashboard" className="btn-nav-cta">
            Developer Portal
            <span className="arrow-icon-pill">→</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '95vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', paddingTop: 68 }}>
        <div ref={heroRef} style={{ willChange: 'transform', transition: 'transform 0.06s linear' }}>
          <div className="hero-eyebrow anim-fade-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            Hybrid Web2 &amp; Web3 Security Platform
          </div>

          <h1 className="anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(72px, 12vw, 164px)', fontWeight: 600, lineHeight: 0.9, letterSpacing: '-0.05em', marginBottom: 48, color: '#f7f8f8' }}>
            License<br />
            <span style={{ WebkitTextStroke: '1px rgba(247,248,248,0.1)', color: 'transparent' }}>Shield</span><br />
            <span style={{ background: 'linear-gradient(135deg, #5e6ad2, #05b169)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI.</span>
          </h1>

          <p className="anim-fade-up anim-delay-2" style={{ fontSize: 17, color: '#8a8f98', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.65 }}>
            Scan npm packages for license conflicts and CVEs in seconds.
            Settled on-chain via Base Sepolia Smart Contract Escrow.
          </p>

          <div className="anim-fade-up anim-delay-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#audit"
              className="arrow-btn"
              style={{ padding: '16px 32px', background: '#fff', color: '#000', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              Run Audit
              <span className="arrow-icon-pill" style={{ background: 'rgba(0,0,0,0.08)' }}>↓</span>
            </a>
            <Link
              href="/dashboard"
              className="arrow-btn"
              style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              Developer Portal
              <span className="arrow-icon-pill">→</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#525252', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, transparent, #525252)' }} />
          Scroll to explore
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 48px 80px' }}>
        <div className="scroll-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 1160, margin: '0 auto' }}>
          {STATS.map((s, i) => (
            <div
              key={i}
              className="glass-card"
              style={{ textAlign: 'center', padding: '28px 20px', transition: 'transform 0.4s ease', transform: 'perspective(600px) rotateX(6deg)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'perspective(600px) rotateX(0deg) translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'perspective(600px) rotateX(6deg)'; }}
            >
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 6, color: '#f7f8f8' }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#8a8f98', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIT SECTION ───────────────────────── */}
      <section id="audit" style={{ position: 'relative', zIndex: 1, padding: '0 48px 120px', maxWidth: 1300, margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ marginBottom: 56, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 76px)', fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 12, color: '#f7f8f8' }}>
            New <span style={{ color: '#8a8f98' }}>Security</span> Audit.
          </h2>
          <p style={{ color: '#8a8f98', fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.6 }}>
            Enter your dependencies below and get an instant AI-powered compliance verdict.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Form Card */}
          <div ref={tiltRef} className="glass-card scroll-reveal" style={{ transition: 'transform 0.2s ease', willChange: 'transform' }}>
            <div className="card-label">New Audit</div>
            <form onSubmit={handleAudit}>
              <div className="form-field">
                <label className="field-label">Project License</label>
                <select className="field-select" value={projectLicense} onChange={e => setProjectLicense(e.target.value)}>
                  <option value="MIT">MIT License</option>
                  <option value="APACHE-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPLv3</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="PROPRIETARY">Proprietary</option>
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Dependencies — one per line (name@version)</label>
                <textarea
                  className="field-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={'express@4.18.0\ncolors@1.4.1'}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><div className="spinner" />Scanning...</>
                ) : (
                  <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Run Security Audit</>
                )}
              </button>
              {error && <div className="error-msg">{error}</div>}
            </form>
          </div>

          {/* Results Card */}
          <div className="glass-card scroll-reveal" style={{ minHeight: 480 }}>
            {loading ? (
              <div className="loading-panel">
                <div className="loading-spinner-lg" />
                <p className="loading-text">Querying NPM Registry &amp; OSV.dev...</p>
                <p style={{ fontSize: 11, color: '#62666d', fontFamily: 'var(--font-mono)', marginTop: -8 }}>
                  Gemini 2.5 Flash analysis in progress
                </p>
              </div>
            ) : verdict ? (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div className={`verdict-badge ${verdict.status === 'APPROVED' ? 'approved' : 'flagged'}`} style={{ marginBottom: 14 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {verdict.status}
                  </div>
                  <div className={`verdict-title ${verdict.status === 'APPROVED' ? 'approved' : 'flagged'}`}>
                    {verdict.status === 'APPROVED' ? 'Clean.' : 'Flagged.'}
                  </div>
                  <div className="verdict-subtitle">
                    {verdict.risks.length === 0 ? 'No issues detected.' : `${verdict.risks.length} risk${verdict.risks.length > 1 ? 's' : ''} detected`}
                  </div>
                </div>

                {verdict.aiAnalysis && (
                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1b1e', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5e6ad2', marginBottom: 8 }}>
                      ✦ Gemini 2.5 Flash AI Analysis
                    </div>
                    <p style={{ fontSize: 13, color: '#d0d6e0', lineHeight: 1.7 }}>{verdict.aiAnalysis}</p>
                  </div>
                )}

                {verdict.risks.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a8f98', marginBottom: 10 }}>Risk Summary</div>
                    <table className="risk-table">
                      <thead>
                        <tr>
                          <th>Package</th>
                          <th>Type</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verdict.risks.slice(0, 6).map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#d0d6e0' }}>{r.package}</td>
                            <td style={{ color: '#8a8f98', fontFamily: 'var(--font-sans)' }}>{r.type}</td>
                            <td>
                              <span className={`severity-badge ${r.severity?.toLowerCase().includes('high') || r.severity?.toLowerCase().includes('critical') ? 'high' : r.severity?.toLowerCase().includes('medium') ? 'medium' : 'low'}`}>
                                {r.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {verdict.settlementTxHash && (
                  <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(244,176,0,0.06)', border: '1px solid rgba(244,176,0,0.18)', borderRadius: 8, fontSize: 11, color: '#f4b000', fontFamily: 'var(--font-mono)' }}>
                    ⛓ Settled on Base Sepolia: {verdict.settlementTxHash.slice(0, 20)}...
                  </div>
                )}
              </>
            ) : (
              <div className="result-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p>Submit your dependencies to get an instant verdict</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 48px 140px', maxWidth: 1300, margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 12, color: '#f7f8f8' }}>
            How it <span style={{ color: '#8a8f98' }}>works.</span>
          </h2>
        </div>
        <div className="scroll-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {STEPS.map((f, i) => (
            <div
              key={i}
              className="glass-card"
              style={{ transition: 'transform 0.4s ease', transform: 'perspective(600px) rotateX(5deg)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = `perspective(600px) rotateX(0deg) rotateY(${i === 0 ? '4deg' : i === 2 ? '-4deg' : '0'}) translateY(-8px)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'perspective(600px) rotateX(5deg)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}20`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>{f.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: f.color, marginBottom: 8, textTransform: 'uppercase' }}>Step {f.n}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 10, color: '#f7f8f8' }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#8a8f98', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODEL A / B SECTION ─────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 48px 140px', maxWidth: 1300, margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 12, color: '#f7f8f8' }}>
            Two <span style={{ color: '#8a8f98' }}>billing</span> models.
          </h2>
          <p style={{ fontSize: 15, color: '#8a8f98' }}>One platform. Choose how you pay.</p>
        </div>
        <div className="scroll-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Model A */}
          <div className="glass-card" style={{ border: '1px solid rgba(94,106,210,0.2)', background: 'rgba(94,106,210,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💳</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828fff', marginBottom: 2 }}>Model A</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.04em', color: '#f7f8f8' }}>Web2 SaaS</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#8a8f98', lineHeight: 1.7, marginBottom: 20 }}>
              Monthly Stripe subscriptions for human engineering teams. API key authentication with tiered scan quotas.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Free: 100 scans/month', 'Pro: 10,000 scans/month ($29)', 'Enterprise: Unlimited ($199)'].map(item => (
                <li key={item} style={{ fontSize: 13, color: '#d0d6e0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#828fff', fontSize: 14 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/billing" className="arrow-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 18px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
            >
              View Plans
              <span className="arrow-icon-pill" style={{ width: 22, height: 22, fontSize: 11, background: 'rgba(124,58,237,0.3)' }}>→</span>
            </Link>
          </div>

          {/* Model B */}
          <div className="glass-card" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399', marginBottom: 2 }}>Model B</div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em' }}>Web3 AI Agents</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.7, marginBottom: 20 }}>
              $0.01 USDC per-scan micro-payment escrow on Base Sepolia via x402 Protocol. Designed for autonomous AI agent billing.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Per-scan $0.01 USDC escrow', 'x402 HTTP payment protocol', 'LicenseShieldEscrow.sol on-chain'].map(item => (
                <li key={item} style={{ fontSize: 13, color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#34d399', fontSize: 14 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="arrow-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 18px', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#34d399', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.10)'; }}
            >
              View on BaseScan
              <span className="arrow-icon-diag" style={{ width: 22, height: 22, fontSize: 11, background: 'rgba(16,185,129,0.25)' }}>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer className="footer" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="navbar-logo-icon" style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <span>LicenseShield AI — Hybrid SaaS Platform</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/dashboard" style={{ color: '#525252', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a3a3a3'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#525252'; }}
          >Developer Portal</Link>
          <Link href="/billing" style={{ color: '#525252', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a3a3a3'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#525252'; }}
          >Pricing</Link>
          <span>Base Sepolia Testnet</span>
        </div>
      </footer>
    </div>
  );
}
