'use client';

import { useState, useEffect, useRef } from 'react';

const LICENSES = [
  {
    id: 1,
    name: 'MIT License',
    spdx: 'MIT',
    type: 'Permissive',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: true,
    private: true,
    copyleft: false,
    compatible: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1'],
    description: 'A short and simple permissive license with conditions only requiring preservation of copyright and license notices.',
    risk: 'LOW',
    packages: 14832,
  },
  {
    id: 2,
    name: 'Apache License 2.0',
    spdx: 'Apache-2.0',
    type: 'Permissive',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: true,
    private: true,
    copyleft: false,
    compatible: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'GPL-3.0'],
    description: 'Permissive license whose main conditions require preservation of copyright, license notices, and attribution.',
    risk: 'LOW',
    packages: 8241,
  },
  {
    id: 3,
    name: 'GNU GPLv3',
    spdx: 'GPL-3.0',
    type: 'Copyleft',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: false,
    private: true,
    copyleft: true,
    compatible: ['GPL-3.0', 'LGPL-2.1', 'MIT', 'Apache-2.0'],
    description: 'Strong copyleft license. Derivative works must also be open-sourced under GPL. Incompatible with proprietary software.',
    risk: 'HIGH',
    packages: 3190,
  },
  {
    id: 4,
    name: 'GNU GPLv2',
    spdx: 'GPL-2.0',
    type: 'Copyleft',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: false,
    private: true,
    copyleft: true,
    compatible: ['GPL-2.0', 'MIT', 'BSD-2-Clause'],
    description: 'Earlier version of GPL. Not compatible with GPL-3.0. Enforces open-source for all derivative works.',
    risk: 'HIGH',
    packages: 1204,
  },
  {
    id: 5,
    name: 'BSD 3-Clause',
    spdx: 'BSD-3-Clause',
    type: 'Permissive',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: true,
    private: true,
    copyleft: false,
    compatible: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'GPL-2.0', 'GPL-3.0'],
    description: 'Similar to MIT but adds a non-endorsement clause restricting use of author names for promotion.',
    risk: 'LOW',
    packages: 5621,
  },
  {
    id: 6,
    name: 'ISC License',
    spdx: 'ISC',
    type: 'Permissive',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: true,
    private: true,
    copyleft: false,
    compatible: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'GPL-2.0', 'GPL-3.0'],
    description: 'Functionally equivalent to the MIT license. Commonly used by Node.js packages.',
    risk: 'LOW',
    packages: 9340,
  },
  {
    id: 7,
    name: 'GNU LGPLv2.1',
    spdx: 'LGPL-2.1',
    type: 'Weak Copyleft',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: false,
    private: true,
    copyleft: true,
    compatible: ['MIT', 'Apache-2.0', 'LGPL-2.1', 'GPL-2.0', 'GPL-3.0'],
    description: 'Weaker copyleft — allows linking from proprietary software. Libraries using this can be used commercially.',
    risk: 'MEDIUM',
    packages: 2100,
  },
  {
    id: 8,
    name: 'Mozilla Public License 2.0',
    spdx: 'MPL-2.0',
    type: 'Weak Copyleft',
    commercial: true,
    modify: true,
    distribute: true,
    sublicense: false,
    private: true,
    copyleft: true,
    compatible: ['MIT', 'Apache-2.0', 'MPL-2.0'],
    description: 'File-level copyleft. Changes to MPL-licensed files must be shared, but can link with proprietary code.',
    risk: 'MEDIUM',
    packages: 980,
  },
];

const riskColors: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const typeColors: Record<string, string> = {
  Permissive: 'rgba(34,197,94,0.1)',
  Copyleft: 'rgba(239,68,68,0.1)',
  'Weak Copyleft': 'rgba(245,158,11,0.1)',
};

const typeTextColors: Record<string, string> = {
  Permissive: '#22c55e',
  Copyleft: '#ef4444',
  'Weak Copyleft': '#f59e0b',
};

export default function VaultPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<typeof LICENSES[0] | null>(null);
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
    // Trigger once
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = LICENSES.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.spdx.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || l.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ background: '#000', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Canvas BG */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* NAVBAR */}
      <nav className="navbar" style={{ zIndex: 50 }}>
        <a href="/" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          LicenseShield AI
        </a>
        <ul className="navbar-links">
          <li><a href="/">Audit</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/vault" style={{ color: '#fff' }}>Vault</a></li>
        </ul>
        <div className="navbar-badge">
          <span className="status-dot" />
          CROO Network
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', paddingTop: 80 }}>
        <div ref={heroRef} style={{ willChange: 'transform', transition: 'transform .05s linear' }}>
          <div className="hero-eyebrow anim-fade-up" style={{ justifyContent: 'center', display: 'flex' }}>License Intelligence</div>
          <h1 className="anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(56px,9vw,120px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: 28 }}>
            License<br />
            <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.15)', color: 'transparent' }}>Vault</span><span style={{ background: 'linear-gradient(135deg,#7c3aed,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.</span>
          </h1>
          <p className="anim-fade-up anim-delay-2" style={{ fontSize: 16, color: '#a3a3a3', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            A comprehensive reference of all SPDX licenses, their permissions, conditions, and compatibility with your project.
          </p>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="page-container" style={{ position: 'relative', zIndex: 1, paddingTop: 0 }}>
        {/* CONTROLS */}
        <div className="scroll-reveal" style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap', width: '100%' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: 260 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#525252' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="field-input"
              style={{ paddingLeft: 42 }}
              placeholder="Search licenses (e.g. MIT, GPL)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Permissive', 'Weak Copyleft', 'Copyleft'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: filter === f ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                  background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filter === f ? '#fff' : '#525252',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  transition: 'all 0.2s',
                  width: 'auto',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* GRID + DETAIL */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20, paddingBottom: 100 }}>
          {/* CARD GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignContent: 'start', perspective: 1000 }}>
            {filtered.map((lic, i) => (
              <div
                key={lic.id}
                className="glass-card scroll-reveal"
                style={{
                  cursor: 'pointer',
                  borderColor: selected?.id === lic.id ? 'rgba(255,255,255,0.25)' : undefined,
                  transform: 'perspective(600px) rotateX(6deg)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={() => setSelected(selected?.id === lic.id ? null : lic)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'perspective(600px) rotateX(0deg) translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'perspective(600px) rotateX(6deg)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ background: typeColors[lic.type], borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: typeTextColors[lic.type] }}>
                    {lic.type}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColors[lic.risk], boxShadow: `0 0 8px ${riskColors[lic.risk]}` }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>{lic.name}</div>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#525252', marginBottom: 12 }}>{lic.spdx}</div>
                <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.6, letterSpacing: '-0.01em' }}>{lic.description.slice(0, 80)}...</p>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#525252' }}>{lic.packages.toLocaleString()} packages</span>
                  <span style={{ fontSize: 12, color: riskColors[lic.risk], fontWeight: 600 }}>{lic.risk} RISK</span>
                </div>
              </div>
            ))}
          </div>

          {/* DETAIL PANEL */}
          {selected && (
            <div className="glass-card scroll-reveal revealed" style={{ position: 'sticky', top: 88, height: 'fit-content', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ background: typeColors[selected.type], borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: typeTextColors[selected.type] }}>
                  {selected.type}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 13, color: '#525252', marginBottom: 20 }}>{selected.spdx}</div>
              <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7, letterSpacing: '-0.01em', marginBottom: 28 }}>{selected.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                {[
                  { label: 'Commercial Use', val: selected.commercial },
                  { label: 'Modification', val: selected.modify },
                  { label: 'Distribution', val: selected.distribute },
                  { label: 'Sublicense', val: selected.sublicense },
                  { label: 'Private Use', val: selected.private },
                  { label: 'Copyleft', val: selected.copyleft, invert: true },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: (item.val !== item.invert) ? '#22c55e' : '#ef4444' }}>
                      <span>{item.val ? '✓' : '✕'}</span>
                      {item.val ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#525252', marginBottom: 12 }}>Compatible With</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.compatible.map(c => (
                    <span key={c} style={{ fontFamily: 'Courier New, monospace', fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
