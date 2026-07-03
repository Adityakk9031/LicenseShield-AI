'use client';

import { useState, useEffect, useRef } from 'react';

const REPORTS = [
  {
    id: 'rpt_001',
    timestamp: '2026-07-03T10:41:00Z',
    projectLicense: 'MIT',
    packages: ['colors@1.4.1', 'lodash@4.17.20', 'react@18.2.0'],
    status: 'FLAGGED' as const,
    risks: 3,
    high: 1,
    medium: 2,
    low: 0,
    crooTx: 'ord_60da9afe',
    duration: '2.8s',
  },
  {
    id: 'rpt_002',
    timestamp: '2026-07-03T09:15:00Z',
    projectLicense: 'Apache-2.0',
    packages: ['express@4.18.2', 'axios@1.4.0', 'dotenv@16.0.3'],
    status: 'APPROVED' as const,
    risks: 0,
    high: 0,
    medium: 0,
    low: 0,
    crooTx: 'ord_a12bcd44',
    duration: '1.9s',
  },
  {
    id: 'rpt_003',
    timestamp: '2026-07-03T08:02:00Z',
    projectLicense: 'MIT',
    packages: ['minify-maven@1.0.0', 'left-pad@1.3.0'],
    status: 'FLAGGED' as const,
    risks: 2,
    high: 0,
    medium: 2,
    low: 0,
    crooTx: 'ord_f99e8821',
    duration: '3.1s',
  },
  {
    id: 'rpt_004',
    timestamp: '2026-07-02T22:50:00Z',
    projectLicense: 'GPL-3.0',
    packages: ['chalk@5.3.0', 'commander@11.0.0', 'inquirer@9.2.0'],
    status: 'APPROVED' as const,
    risks: 0,
    high: 0,
    medium: 0,
    low: 0,
    crooTx: 'ord_cc3471fe',
    duration: '2.2s',
  },
  {
    id: 'rpt_005',
    timestamp: '2026-07-02T18:30:00Z',
    projectLicense: 'PROPRIETARY',
    packages: ['moment@2.29.4', 'uuid@9.0.0', 'lodash@4.17.21', 'prettier@3.0.0'],
    status: 'FLAGGED' as const,
    risks: 4,
    high: 2,
    medium: 1,
    low: 1,
    crooTx: 'ord_11aabb77',
    duration: '3.7s',
  },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReportsPage() {
  const [selected, setSelected] = useState<typeof REPORTS[0] | null>(REPORTS[0]);
  const [filter, setFilter] = useState('All');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // WebGL-style canvas background
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
      particles.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3, size: Math.random()*1.5+.5, alpha: Math.random()*.4+.1 });
    }

    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const grid = 80;
      for (let x = 0; x < canvas.width; x += grid) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += grid) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`; ctx.fill();
      });
      const cx = canvas.width/2, cy = canvas.height/2;
      const gv = ctx.createRadialGradient(cx,cy*.4,0,cx,cy*.4,400);
      gv.addColorStop(0,'rgba(124,58,237,0.12)'); gv.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = gv; ctx.fillRect(0,0,canvas.width,canvas.height);
      t++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Scroll perspective
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (heroRef.current) {
        const scale = Math.max(0.85, 1 - y * 0.0003);
        const tz = Math.min(0, -y * 0.15);
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
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = REPORTS.filter(r => filter === 'All' || r.status === filter);

  const totalScanned = REPORTS.reduce((a, r) => a + r.packages.length, 0);
  const totalFlagged = REPORTS.filter(r => r.status === 'FLAGGED').length;
  const totalRisks = REPORTS.reduce((a, r) => a + r.risks, 0);
  const totalHigh = REPORTS.reduce((a, r) => a + r.high, 0);

  return (
    <div style={{ background: '#000', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Canvas BG */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <nav className="navbar" style={{ zIndex: 50 }}>
        <a href="/" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          LicenseShield AI
        </a>
        <ul className="navbar-links">
          <li><a href="/">Audit</a></li>
          <li><a href="/reports" style={{ color: '#fff' }}>Reports</a></li>
          <li><a href="/vault">Vault</a></li>
        </ul>
        <div className="navbar-badge">
          <span className="status-dot" />
          CROO Network
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', paddingTop: 80 }}>
        <div ref={heroRef} style={{ willChange: 'transform', transition: 'transform .05s linear' }}>
          <div className="hero-eyebrow anim-fade-up" style={{ justifyContent: 'center', display: 'flex' }}>Audit History</div>
          <h1 className="anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(56px,9vw,120px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: 28 }}>
            Audit<br />
            <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.15)', color: 'transparent' }}>Reports</span><span style={{ background: 'linear-gradient(135deg,#7c3aed,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.</span>
          </h1>
        </div>
      </section>

      <div className="page-container" style={{ position: 'relative', zIndex: 1, paddingTop: 0, paddingBottom: 100 }}>
        {/* SUMMARY STATS */}
        <div className="stats-bar scroll-reveal" style={{ marginBottom: 40, perspective: 1000 }}>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value">{REPORTS.length}</div>
            <div className="stat-label">Total audits</div>
          </div>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value" style={{ color: '#22c55e' }}>{REPORTS.length - totalFlagged}</div>
            <div className="stat-label">Clean</div>
          </div>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value" style={{ color: '#ef4444' }}>{totalFlagged}</div>
            <div className="stat-label">Flagged</div>
          </div>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value">{totalScanned}</div>
            <div className="stat-label">Packages scanned</div>
          </div>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value" style={{ color: '#ef4444' }}>{totalHigh}</div>
            <div className="stat-label">High severity</div>
          </div>
          <div className="stat-item" style={{ transform: 'perspective(600px) rotateX(6deg)' }}>
            <div className="stat-value">{totalRisks}</div>
            <div className="stat-label">Total risks found</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="scroll-reveal" style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['All', 'APPROVED', 'FLAGGED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 10, border: '1px solid',
                borderColor: filter === f ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: filter === f ? '#fff' : '#525252',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '-0.01em', transition: 'all 0.2s', width: 'auto',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* REPORTS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, perspective: 1000 }}>
            {filtered.map((rpt, i) => (
              <div
                key={rpt.id}
                className="glass-card scroll-reveal"
                onClick={() => setSelected(rpt)}
                style={{
                  cursor: 'pointer',
                  padding: 24,
                  borderColor: selected?.id === rpt.id ? 'rgba(255,255,255,0.25)' : undefined,
                  transform: 'perspective(600px) rotateX(6deg)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'perspective(600px) rotateX(0deg) translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'perspective(600px) rotateX(6deg)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#525252' }}>{rpt.id}</div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    background: rpt.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: rpt.status === 'APPROVED' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${rpt.status === 'APPROVED' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {rpt.status}
                  </div>
                </div>

                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {rpt.packages.slice(0, 2).join(', ')}{rpt.packages.length > 2 ? ` +${rpt.packages.length - 2} more` : ''}
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#525252' }}>License: {rpt.projectLicense}</span>
                  <span style={{ fontSize: 12, color: '#525252' }}>{timeAgo(rpt.timestamp)}</span>
                  {rpt.risks > 0 && (
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{rpt.risks} risk{rpt.risks > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DETAIL VIEW */}
          {selected && (
            <div className="glass-card scroll-reveal revealed" style={{ position: 'sticky', top: 88, height: 'fit-content', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#525252', marginBottom: 8 }}>{selected.id}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: selected.status === 'APPROVED' ? '#22c55e' : '#ef4444' }}>
                    {selected.status === 'APPROVED' ? 'Clean.' : 'Flagged.'}
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', height: 'fit-content',
                  background: selected.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: selected.status === 'APPROVED' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${selected.status === 'APPROVED' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {selected.status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                {[
                  { label: 'Date', value: formatDate(selected.timestamp) },
                  { label: 'Duration', value: selected.duration },
                  { label: 'Project License', value: selected.projectLicense },
                  { label: 'CROO TX', value: selected.crooTx },
                  { label: 'High Risk', value: selected.high.toString(), color: selected.high > 0 ? '#ef4444' : undefined },
                  { label: 'Medium Risk', value: selected.medium.toString(), color: selected.medium > 0 ? '#f59e0b' : undefined },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: item.color || '#fff', fontFamily: item.label === 'CROO TX' || item.label === 'Duration' ? 'Courier New, monospace' : undefined }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#525252', marginBottom: 12 }}>Packages Scanned ({selected.packages.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.packages.map((pkg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontFamily: 'Courier New, monospace', fontSize: 13, color: '#a3a3a3' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      {pkg}
                    </div>
                  ))}
                </div>
              </div>

              {selected.risks > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#525252', marginBottom: 12 }}>Risk Breakdown</div>
                  <div style={{ display: 'flex', gap: 2, borderRadius: 8, overflow: 'hidden', height: 8, marginBottom: 16 }}>
                    {selected.high > 0 && <div style={{ flex: selected.high, background: '#ef4444' }} />}
                    {selected.medium > 0 && <div style={{ flex: selected.medium, background: '#f59e0b' }} />}
                    {selected.low > 0 && <div style={{ flex: selected.low, background: '#a3a3a3' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#ef4444' }}>● {selected.high} High</span>
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>● {selected.medium} Medium</span>
                    <span style={{ fontSize: 12, color: '#a3a3a3' }}>● {selected.low} Low</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
                <a href="/" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', transition: 'background 0.2s' }}>
                  Re-run Audit →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
