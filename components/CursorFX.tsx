'use client';

import { useEffect, useRef, useCallback } from 'react';

const BTN_SELECTORS = 'button, .btn-primary, .btn-brand, .btn-ghost, .btn-emerald, .btn-nav-cta, .auth-submit, .billing-card .btn-primary';
const HOVER_SELECTORS = 'a, button, [role="button"], input, textarea, select, label, .quick-action-card, .glass-card, .dash-nav-item, .billing-card, .arrow-btn, [data-cursor="hover"]';

export default function CursorFX() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const torchRef = useRef<HTMLDivElement>(null);
  const blobRef  = useRef<HTMLDivElement>(null);

  // Exact mouse coordinates
  const mouse  = useRef({ x: -200, y: -200 });
  // Spring-lagged ring position
  const ring   = useRef({ x: -200, y: -200 });
  // Extra lagged liquid torch position
  const torch  = useRef({ x: -200, y: -200 });
  // Velocity for squash/stretch morphing
  const vel    = useRef({ x: 0, y: 0 });
  const raf    = useRef<number>(0);
  const isHover = useRef(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const tick = useCallback(() => {
    const dot     = dotRef.current;
    const ringEl  = ringRef.current;
    const torchEl = torchRef.current;
    const blobEl  = blobRef.current;

    if (!dot || !ringEl || !torchEl || !blobEl) {
      raf.current = requestAnimationFrame(tick);
      return;
    }

    // 1. Spring physics for ring (stiffness ~0.14)
    const prevX = ring.current.x;
    const prevY = ring.current.y;
    ring.current.x = lerp(ring.current.x, mouse.current.x, 0.14);
    ring.current.y = lerp(ring.current.y, mouse.current.y, 0.14);

    // 2. Liquid torch lag (stiffness ~0.08 for smooth fluid motion behind cursor)
    torch.current.x = lerp(torch.current.x, mouse.current.x, 0.08);
    torch.current.y = lerp(torch.current.y, mouse.current.y, 0.08);

    // Calculate movement velocity
    vel.current.x = ring.current.x - prevX;
    vel.current.y = ring.current.y - prevY;

    const speed = Math.sqrt(vel.current.x ** 2 + vel.current.y ** 2);
    const angle = Math.atan2(vel.current.y, vel.current.x) * (180 / Math.PI);

    // Organic stretch based on speed
    const stretch = Math.min(speed * 0.08, 0.5);
    const scaleX  = isHover.current ? 1.3 : 1 + stretch;
    const scaleY  = isHover.current ? 1.3 : Math.max(0.6, 1 - stretch * 0.4);

    // Precise pointer dot (no lag)
    dot.style.transform = `translate3d(${mouse.current.x - 3}px, ${mouse.current.y - 3}px, 0)`;

    // Liquid Torch Spotlight (follows with smooth ambient lag)
    torchEl.style.transform = `translate3d(${torch.current.x - 220}px, ${torch.current.y - 220}px, 0)`;

    // Organic ring follower with velocity stretch & rotation
    ringEl.style.transform =
      `translate3d(${ring.current.x - 20}px, ${ring.current.y - 20}px, 0) ` +
      `rotate(${angle}deg) scaleX(${scaleX}) scaleY(${scaleY})`;

    // Inner morphing liquid blob
    blobEl.style.transform = `translate3d(${ring.current.x - 40}px, ${ring.current.y - 40}px, 0) scale(${isHover.current ? 1.4 : 1})`;

    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onLeaveWindow = () => {
      if (dotRef.current)   dotRef.current.style.opacity   = '0';
      if (ringRef.current)  ringRef.current.style.opacity  = '0';
      if (torchRef.current) torchRef.current.style.opacity = '0';
      if (blobRef.current)  blobRef.current.style.opacity  = '0';
    };

    const onEnterWindow = () => {
      if (dotRef.current)   dotRef.current.style.opacity   = '1';
      if (ringRef.current)  ringRef.current.style.opacity  = '1';
      if (torchRef.current) torchRef.current.style.opacity = '1';
      if (blobRef.current)  blobRef.current.style.opacity  = '1';
    };

    const onEnterEl = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target?.closest(HOVER_SELECTORS)) {
        isHover.current = true;
        dotRef.current?.classList.add('cursor-dot--hidden');
        ringRef.current?.classList.add('cursor-ring--hover');
        torchRef.current?.classList.add('cursor-torch--hover');
        blobRef.current?.classList.add('cursor-blob--hover');

        if (target?.closest(BTN_SELECTORS)) {
          ringRef.current?.classList.add('cursor-ring--hover-cta');
        }
      }
    };

    const onLeaveEl = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target?.closest(HOVER_SELECTORS)) {
        isHover.current = false;
        dotRef.current?.classList.remove('cursor-dot--hidden');
        ringRef.current?.classList.remove('cursor-ring--hover', 'cursor-ring--hover-cta');
        torchRef.current?.classList.remove('cursor-torch--hover');
        blobRef.current?.classList.remove('cursor-blob--hover');
      }
    };

    window.addEventListener('mousemove',  onMove,        { passive: true });
    document.addEventListener('mouseover',  onEnterEl,     { passive: true });
    document.addEventListener('mouseout',   onLeaveEl,     { passive: true });
    document.addEventListener('mouseleave', onLeaveWindow, { passive: true });
    document.addEventListener('mouseenter', onEnterWindow, { passive: true });

    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseover',  onEnterEl);
      document.removeEventListener('mouseout',   onLeaveEl);
      document.removeEventListener('mouseleave', onLeaveWindow);
      document.removeEventListener('mouseenter', onEnterWindow);
    };
  }, [tick]);

  return (
    <>
      {/* 1. Large Fluid Ambient Liquid Torch / Spotlight (matches getdesign.md illumination effect) */}
      <div ref={torchRef} className="cursor-torch" aria-hidden="true" />

      {/* 2. Fluid Deforming Liquid Blob Aura */}
      <div ref={blobRef} className="cursor-blob" aria-hidden="true" />

      {/* 3. Spring Lagged Outer Ring */}
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />

      {/* 4. Exact Pointer Center Dot */}
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}

