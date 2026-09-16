'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollZoomHeroMediaProps {
  onOpenVideo: () => void;
}

export default function ScrollZoomHeroMedia({ onOpenVideo }: ScrollZoomHeroMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for smooth zoom effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  // Smooth scroll transformations: scale from 0.88 to 1.06, rotateX from 12deg to 0deg
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1.06]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.6, 0.9, 1]);

  return (
    <div ref={containerRef} className="scroll-zoom-media-wrap">
      <motion.div
        className="scroll-zoom-card"
        style={{
          scale,
          rotateX,
          opacity,
        }}
        onClick={onOpenVideo}
      >
        {/* Dark Cyber Vault Art Image */}
        <Image
          src="/images/dark-vault.png"
          alt="LicenseShield Autonomous Security Vault"
          fill
          priority
          style={{ objectFit: 'cover', opacity: 0.82 }}
        />

        {/* Ambient Dark Overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(5,6,8,0.2) 0%, rgba(5,6,8,0.85) 100%)',
          }}
        />

        {/* Floating Interactive Video Header & Play Action */}
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', padding: 28, textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tag tag-cyan">DEMO FILM · 4K 60FPS</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
              Scroll to zoom &amp; open portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-cyan) 0%, var(--brand-blue) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#050608', boxShadow: '0 0 24px var(--brand-cyan-glow)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                Autonomous Security &amp; License Portal
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Click to watch complete system walk-through film (Base Sepolia Verified)
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
