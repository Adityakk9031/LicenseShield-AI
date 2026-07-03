'use client';
import { useState, useEffect, useRef } from 'react';

interface Risk { package: string; type: string; severity: string; detail: string; }
interface AuditVerdict { status: 'APPROVED'|'FLAGGED'; risks: Risk[]; suggestions: string[]; capTransaction?: { orderId: string }; }

export default function Home() {
  const [input, setInput] = useState('colors@1.4.1\nlodash@4.17.20\nreact@18.2.0');
  const [projectLicense, setProjectLicense] = useState('MIT');
  const [verdict, setVerdict] = useState<AuditVerdict|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

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
      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const grid = 80;
      for (let x = 0; x < canvas.width; x += grid) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += grid) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`; ctx.fill();
      });
      // Glowing orbs
      const cx = canvas.width/2, cy = canvas.height/2;
      const gv = ctx.createRadialGradient(cx+Math.sin(t*.001)*100,cy*.6,0,cx,cy*.6,400);
      gv.addColorStop(0,'rgba(124,58,237,0.12)'); gv.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = gv; ctx.fillRect(0,0,canvas.width,canvas.height);
      const g2 = ctx.createRadialGradient(cx*.4,cy*1.2,0,cx*.4,cy*1.2,300);
      g2.addColorStop(0,'rgba(16,185,129,0.08)'); g2.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0,0,canvas.width,canvas.height);
      t++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Scroll-driven 3D perspective
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
      // Reveal sections
      document.querySelectorAll<HTMLElement>('.scroll-reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) el.classList.add('revealed');
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mouse tilt on hero card
  useEffect(() => {
    const el = tiltRef.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x*18}deg) rotateX(${-y*18}deg) scale(1.02)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; };
    el.addEventListener('mousemove', onMove); el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setVerdict(null);
    const packages = input.split('\n').map(l=>l.trim()).filter(Boolean).map(l => {
      const i = l.lastIndexOf('@');
      return i > 0 ? { name: l.slice(0,i), version: l.slice(i+1), ecosystem:'npm' } : { name:l, ecosystem:'npm' };
    });
    try {
      const res = await fetch('/api/audit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({packages, projectLicense}) });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      await new Promise(r => setTimeout(r, 1200));
      setVerdict(data);
    } catch(err:any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ background:'#000', minHeight:'100vh', overflowX:'hidden' }}>
      {/* Canvas BG */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />

      {/* NAV */}
      <nav className="navbar" style={{ zIndex:50 }}>
        <a href="/" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          LicenseShield AI
        </a>
        <ul className="navbar-links">
          <li><a href="/" style={{color:'#fff'}}>Audit</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/vault">Vault</a></li>
        </ul>
        <div className="navbar-badge"><span className="status-dot"/>CROO Network</div>
      </nav>

      {/* HERO — 3D scroll section */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 24px', paddingTop:72 }}>
        <div ref={heroRef} style={{ willChange:'transform', transition:'transform .05s linear' }}>
          <div className="hero-eyebrow anim-fade-up" style={{justifyContent:'center', display:'flex'}}>Powered by CROO Agent Protocol</div>
          <h1 className="anim-fade-up anim-delay-1" style={{ fontSize:'clamp(64px,11vw,160px)', fontWeight:900, lineHeight:.88, letterSpacing:'-.05em', marginBottom:40 }}>
            License<br/>
            <span style={{ WebkitTextStroke:'1px rgba(255,255,255,0.15)', color:'transparent' }}>Shield</span><br/>
            <span style={{background:'linear-gradient(135deg,#7c3aed,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>AI.</span>
          </h1>
          <p className="anim-fade-up anim-delay-2" style={{ fontSize:17, color:'#a3a3a3', maxWidth:480, margin:'0 auto 48px', lineHeight:1.6 }}>
            Scan npm packages for license conflicts and CVEs in seconds. Settled on-chain via the CROO Network.
          </p>
          <div className="anim-fade-up anim-delay-3" style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
            <a href="#audit" style={{ padding:'16px 36px', background:'#fff', color:'#000', borderRadius:12, fontWeight:700, fontSize:15, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, transition:'transform .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
              Run Audit <span style={{fontSize:20}}>↓</span>
            </a>
            <a href="/vault" style={{ padding:'16px 36px', background:'rgba(255,255,255,0.06)', color:'#fff', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, fontWeight:600, fontSize:15, textDecoration:'none', transition:'all .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.3)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.12)')}>
              License Vault →
            </a>
          </div>
        </div>

        {/* 3D floating badge */}
        <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#525252', fontSize:12, letterSpacing:'.08em', textTransform:'uppercase' }}>
          <div style={{ width:1, height:40, background:'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.2))', marginBottom:4 }}/>
          Scroll to explore
        </div>
      </section>

      {/* 3D STATS */}
      <section style={{ position:'relative', zIndex:1, padding:'0 48px 80px' }}>
        <div className="scroll-reveal" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:1200, margin:'0 auto', perspective:1000 }}>
          {[{v:'2.4M+',l:'Packages indexed'},{v:'OSV.dev',l:'Vuln database'},{v:'SPDX',l:'License engine'},{v:'<3s',l:'Avg scan time'}].map((s,i)=>(
            <div key={i} className="glass-card" style={{ textAlign:'center', padding:28, animationDelay:`${i*.1}s`, transform:'perspective(600px) rotateX(8deg)', transition:'transform .5s ease' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='perspective(600px) rotateX(0deg) translateY(-4px)')} onMouseLeave={e=>(e.currentTarget.style.transform='perspective(600px) rotateX(8deg)')}>
              <div style={{ fontSize:32, fontWeight:900, letterSpacing:'-.04em', marginBottom:4 }}>{s.v}</div>
              <div style={{ fontSize:12, color:'#525252', letterSpacing:'.02em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AUDIT SECTION */}
      <section id="audit" style={{ position:'relative', zIndex:1, padding:'0 48px 120px', maxWidth:1300, margin:'0 auto' }}>
        <div className="scroll-reveal" style={{ marginBottom:48, textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(36px,5vw,72px)', fontWeight:900, letterSpacing:'-.04em', marginBottom:12 }}>New<span style={{color:'#262626'}}> Security</span> Audit.</h2>
          <p style={{ color:'#525252', fontSize:15 }}>Enter your dependencies below and get an instant verdict.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, perspective:1200 }}>
          {/* FORM CARD — 3D tilt */}
          <div ref={tiltRef} className="glass-card scroll-reveal" style={{ transition:'transform .2s ease', willChange:'transform' }}>
            <div className="card-label">New Audit</div>
            <form onSubmit={handleAudit}>
              <div className="form-field">
                <label className="field-label">Project License</label>
                <select className="field-select" value={projectLicense} onChange={e=>setProjectLicense(e.target.value)}>
                  <option value="MIT">MIT License</option>
                  <option value="APACHE-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPLv3</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="PROPRIETARY">Proprietary</option>
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Dependencies — one per line (name@version)</label>
                <textarea className="field-textarea" value={input} onChange={e=>setInput(e.target.value)} placeholder={'express@4.18.0\ncolors@1.4.1'} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><div className="spinner"/>Scanning...</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Run Security Audit</>}
              </button>
              {error && <div className="error-msg">{error}</div>}
            </form>
          </div>

          {/* RESULTS */}
          <div className="glass-card scroll-reveal" style={{ minHeight:480 }}>
            {loading ? (
              <div className="loading-panel">
                <div className="loading-spinner-lg"/>
                <p className="loading-text">Querying NPM Registry & OSV.dev...</p>
              </div>
            ) : verdict ? (
              <>
                <div style={{ marginBottom:24 }}>
                  <div className={`verdict-badge ${verdict.status==='APPROVED'?'approved':'flagged'}`} style={{marginBottom:16}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                    {verdict.status}
                  </div>
                  <div className={`verdict-title ${verdict.status==='APPROVED'?'approved':'flagged'}`}>{verdict.status==='APPROVED'?'Clean.':'Flagged.'}</div>
                  <div className="verdict-subtitle">{verdict.risks.length===0?'No issues detected.': `${verdict.risks.length} risk${verdict.risks.length>1?'s':''} detected`}</div>
                </div>
                {verdict.capTransaction?.orderId && <div className="tx-chip"><span>CROO TX</span>{verdict.capTransaction.orderId}</div>}
                {verdict.risks.length>0 && (
                  <><div className="risk-list-header">{verdict.risks.length} Risk{verdict.risks.length>1?'s':''} Found</div>
                  {verdict.risks.map((r,i)=>(
                    <div key={i} className="risk-item">
                      <div className={`risk-dot ${r.severity}`}/>
                      <div className="risk-info"><div className="risk-package">{r.package}</div><div className="risk-detail">{r.detail}</div></div>
                      <div className={`risk-type-badge ${r.type}`}>{r.type}</div>
                    </div>
                  ))}</>
                )}
              </>
            ) : (
              <div className="result-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Run an audit to see results</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3D FEATURE CARDS */}
      <section style={{ position:'relative', zIndex:1, padding:'0 48px 140px', maxWidth:1300, margin:'0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign:'center', marginBottom:56 }}>
          <h2 style={{ fontSize:'clamp(32px,4vw,56px)', fontWeight:900, letterSpacing:'-.04em', marginBottom:12 }}>How it <span style={{color:'#262626'}}>works.</span></h2>
        </div>
        <div className="scroll-reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, perspective:1000 }}>
          {[
            { n:'01', title:'Fetch Metadata', desc:'Queries the NPM Registry API for package license declarations and version data in real-time.', icon:'📦', color:'#7c3aed' },
            { n:'02', title:'Scan Vulnerabilities', desc:'Batch queries OSV.dev for known CVEs and security advisories across all your dependencies.', icon:'🔍', color:'#10b981' },
            { n:'03', title:'CROO Settlement', desc:'Verdict is delivered and settled on-chain via the CROO Agent Protocol CAP SDK on Base Sepolia.', icon:'⛓', color:'#f59e0b' },
          ].map((f,i)=>(
            <div key={i} className="glass-card" style={{ animationDelay:`${i*.12}s`, transition:'transform .4s ease', transform:'perspective(600px) rotateX(6deg)' }}
              onMouseEnter={e=>(e.currentTarget.style.transform=`perspective(600px) rotateX(0deg) rotateY(${i===0?'4deg':i===2?'-4deg':'0deg'}) translateY(-8px)`)} onMouseLeave={e=>(e.currentTarget.style.transform='perspective(600px) rotateX(6deg)')}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${f.color}20`, border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:20 }}>{f.icon}</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', color:f.color, marginBottom:8 }}>STEP {f.n}</div>
              <div style={{ fontSize:19, fontWeight:700, letterSpacing:'-.03em', marginBottom:10 }}>{f.title}</div>
              <div style={{ fontSize:14, color:'#737373', lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ position:'relative', zIndex:1, padding:'32px 48px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', color:'#525252', fontSize:13 }}>
        <span>LicenseShield AI — CROO Network Agent</span>
        <span>Base Sepolia Testnet</span>
      </footer>
    </div>
  );
}
