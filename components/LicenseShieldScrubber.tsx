'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface LicenseShieldScrubberProps {
  totalFrames?: number;
  framePathPattern?: (index: number) => string;
  onProgressChange?: (progress: number) => void;
  children?: React.ReactNode;
}

export default function LicenseShieldScrubber({
  totalFrames = 240,
  framePathPattern = (i) => `/frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`,
  onProgressChange,
  children,
}: LicenseShieldScrubberProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const currentFrameRef = useRef(0);

  // Preload all frames into memory
  useEffect(() => {
    let count = 0;
    const loadedImages: HTMLImageElement[] = [];
    const total = totalFrames;

    for (let i = 1; i <= total; i++) {
      const img = new Image();
      img.src = framePathPattern(i);
      img.onload = () => {
        count++;
        setLoadedCount(count);
        if (count === total) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        count++;
        setLoadedCount(count);
        if (count === total) {
          setImagesLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, [totalFrames, framePathPattern]);

  // Render canvas frame based on frame index
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Responsive cover calculation
    const hRatio = displayWidth / img.width;
    const vRatio = displayHeight / img.height;
    const ratio = Math.max(hRatio, vRatio);

    const centerShift_x = (displayWidth - img.width * ratio) / 2;
    const centerShift_y = (displayHeight - img.height * ratio) / 2;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
    );
    ctx.restore();
    currentFrameRef.current = index;
  }, []);

  // Scroll synchronization with requestAnimationFrame
  useEffect(() => {
    if (!imagesLoaded) return;

    let animationFrameId: number;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = maxScroll > 0 ? Math.max(0, Math.min(1, scrollTop / maxScroll)) : 0;

      setScrollPercent(Math.round(scrollFraction * 100));

      if (onProgressChange) {
        onProgressChange(scrollFraction);
      }

      const frameIndex = Math.min(
        totalFrames - 1,
        Math.floor(scrollFraction * totalFrames)
      );

      animationFrameId = requestAnimationFrame(() => renderFrame(frameIndex));
    };

    const handleResize = () => {
      renderFrame(currentFrameRef.current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll(); // Initial render

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [imagesLoaded, totalFrames, renderFrame, onProgressChange]);

  const loadPercent = Math.round((loadedCount / totalFrames) * 100);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100%', background: 'transparent' }}>
      {/* Sticky Full-Screen Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Ambient Vignette & Darkness Layer for Crystal-Clear Text */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(2, 4, 8, 0.38) 0%, rgba(2, 4, 8, 0.78) 65%, rgba(2, 4, 8, 0.97) 100%)',
        }}
      />

      {/* Floating Scroll Progress Pill */}
      {imagesLoaded && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 90,
            background: 'rgba(11, 16, 26, 0.85)',
            border: '1px solid var(--border-glass)',
            padding: '6px 14px',
            borderRadius: 20,
            backdropFilter: 'blur(12px)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
          <span>Timeline: {scrollPercent}%</span>
        </div>
      )}

      {/* Loading HUD before frames are in memory */}
      {!imagesLoaded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: '#020408',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #00F2FE', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00F2FE' }}>
              Loading LicenseShield Engine
            </span>
          </div>

          <div style={{ width: 280, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00F2FE 0%, #6366F1 100%)',
                width: `${loadPercent}%`,
                transition: 'width 0.1s ease-out',
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10 }}>
            Preloading frame buffer ({loadedCount}/{totalFrames}) · {loadPercent}%
          </div>
        </div>
      )}

      {/* Layered Interactive Content Overlay */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>{children}</div>
    </div>
  );
}
