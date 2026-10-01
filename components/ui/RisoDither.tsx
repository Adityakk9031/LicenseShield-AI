'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * RisoDither — animated flow field quantized through a Bayer matrix into a
 * limited ink palette: crisp retro risograph halftone dithering with
 * wind-swept ribbons and a drifting luminous core.
 *
 * Rendered on a fixed canvas behind the hero, fading out via CSS mask so the
 * LicenseShield scroll-scrub animation takes over further down the page.
 */

export interface RisoDitherProps {
  /** Ink ramp from dim base ink to brightest highlight ink */
  palette?: string[];
  /** Paper color the dither dissolves into */
  bg?: string;
  /** 1 = opaque paper; 0 = background-level cells fully transparent (dithered cutout) */
  bgAlpha?: number;
  /** Flow speed: 0.02–2 (keep <= 0.5 for hero backgrounds) */
  speed?: number;
  /** Dither cell size in device pixels, 1–16 */
  pixelSize?: number;
  /** Quantization steps across the palette, 2–16 */
  levels?: number;
  /** Flow-field zoom, 0.3–5 */
  scale?: number;
  /** Graphic separation, 0.4–2.5 (1.4–1.8 = bold editorial) */
  contrast?: number;
  /** Ribbon direction in degrees (0 = horizontal bands, 45 = dynamic diagonal) */
  flowAngle?: number;
  /** Secondary turbulence 0–1 (keep < 0.6 for elegant looks) */
  detail?: number;
  /** Luminous hotspot strength 0–1 */
  glow?: number;
  /** Bayer matrix size: 2, 4, or 8 */
  matrix?: 2 | 4 | 8;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// ── Bayer matrices ────────────────────────────────────────────────────────────
const BAYER_2 = [0, 2, 3, 1];

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

const BAYER_MATRICES: Record<number, { data: number[]; size: number; max: number }> = {
  2: { data: BAYER_2, size: 2, max: 4 },
  4: { data: BAYER_4, size: 4, max: 16 },
  8: { data: BAYER_8, size: 8, max: 64 },
};

// ── Seeded hash noise (deterministic, no deps) ───────────────────────────────
function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 144665;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, y * freq, seed + o * 101) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

export default function RisoDither({
  palette = ['#0B0A1E', '#2E2A72', '#5346C8', '#7C6FE8', '#B7A6F4', '#E8A0C8'],
  bg = '#08071A',
  bgAlpha = 1,
  speed = 0.28,
  pixelSize = 6,
  levels = 6,
  scale = 1.4,
  contrast = 1.55,
  flowAngle = 32,
  detail = 0.35,
  glow = 0.55,
  matrix = 8,
  style,
}: RisoDitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const [scrollDissolve, setScrollDissolve] = useState(0);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      setScrollDissolve(Math.min(1, window.scrollY / (vh * 0.85)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: bgAlpha < 1 });
    if (!ctx) return;

    const bayer = BAYER_MATRICES[matrix] ?? BAYER_MATRICES[8];

    // Parse palette into RGB
    const inkRGB = palette.map((hex) => {
      const h = hex.replace('#', '');
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ] as [number, number, number];
    });
    const bgRGB: [number, number, number] = [
      parseInt(bg.replace('#', '').slice(0, 2), 16),
      parseInt(bg.replace('#', '').slice(2, 4), 16),
      parseInt(bg.replace('#', '').slice(4, 6), 16),
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.ceil(width / pixelSize);
      canvas.height = Math.ceil(height / pixelSize);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.imageSmoothingEnabled = false;
    };

    const angleRad = (flowAngle * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);

    const render = (timeMs: number) => {
      const t = (timeMs / 1000) * speed;
      const gw = canvas.width;
      const gh = canvas.height;

      const img = ctx.createImageData(gw, gh);
      const data = img.data;

      const stepCount = levels + 1; // includes paper level

      for (let py = 0; py < gh; py++) {
        for (let px = 0; px < gw; px++) {
          // Normalized coords, aspect-corrected
          const nx = px / gw - 0.5;
          const ny = py / gh - 0.5;
          const aspect = gw / gh;

          // Flow-field sample: ribbons stretched along flowAngle
          const along = nx * dirX * aspect + ny * dirY;
          const across = -nx * dirY * aspect + ny * dirX;

          let field = fbm(
            along * scale * 2.4 + t * 0.35,
            across * scale * 3.2 - t * 0.12,
            7,
            4
          );

          // Secondary fine turbulence
          if (detail > 0) {
            field = field * (1 - detail * 0.5) + fbm(nx * scale * 9, ny * scale * 9 + t * 0.5, 31, 3) * detail * 0.5;
          }

          // Drifting luminous core
          if (glow > 0) {
            const gx = nx * aspect - Math.sin(t * 0.21) * 0.42;
            const gy = ny - Math.cos(t * 0.16) * 0.3;
            const dist = Math.sqrt(gx * gx + gy * gy);
            field += Math.max(0, 1 - dist * 1.9) * glow * 0.85;
          }

          // Contrast shaping + normalize to 0..1
          field = Math.min(1, Math.max(0, (field - 0.5) * contrast + 0.5));

          // Bayer dithering: quantize into `levels` ink steps
          const bayerIdx = (py % bayer.size) * bayer.size + (px % bayer.size);
          const threshold = (bayer.data[bayerIdx] + 0.5) / bayer.max;

          const scaled = field * levels;
          let step = Math.floor(scaled + (threshold - 0.5) * 0.9);
          step = Math.min(levels - 1, Math.max(0, step));

          const px4 = (py * gw + px) * 4;
          if (bgAlpha < 1 && step === 0) {
            // Background-level cells become fully transparent
            data[px4 + 3] = 0;
          } else {
            const ink = inkRGB[Math.min(inkRGB.length - 1, Math.floor((step / (levels - 1 || 1)) * (inkRGB.length - 1) + 0.0001))];
            data[px4] = ink[0];
            data[px4 + 1] = ink[1];
            data[px4 + 2] = ink[2];
            data[px4 + 3] = 255;
          }
        }
      }

      ctx.putImageData(img, 0, 0);
    };

    const loop = (timeMs: number) => {
      render(timeMs);
      rafRef.current = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [palette, bg, bgAlpha, speed, pixelSize, levels, scale, contrast, flowAngle, detail, glow, matrix]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        // Above the scrub-canvas (z 0) + vignette (z 1) so the dither owns the hero,
        // then dissolves on scroll to reveal the LicenseShield animation
        zIndex: 2,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
        opacity: mounted ? 1 - scrollDissolve : 0,
        transition: 'opacity 0.08s linear',
        ...style,
      }}
    />
  );
}
