'use client';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const iconSizes = {
    sm: { box: 32, svg: 20, fontSize: 16, badgeSize: '9px' },
    md: { box: 38, svg: 24, fontSize: 18, badgeSize: '10px' },
    lg: { box: 48, svg: 30, fontSize: 22, badgeSize: '11px' },
  };

  const current = iconSizes[size];

  return (
    <div className={`flex items-center gap-3 group cursor-pointer select-none ${className}`}>
      {/* 3D Glassmorphic Geometric Startup Shield Icon */}
      <div
        style={{
          width: current.box,
          height: current.box,
          borderRadius: size === 'lg' ? 14 : 11,
          background: 'linear-gradient(135deg, rgba(8, 16, 32, 0.95) 0%, rgba(2, 6, 14, 0.98) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -2px 6px rgba(0, 242, 254, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(0,242,254,0.45)] group-hover:border-[rgba(0,242,254,0.7)]"
      >
        {/* Ambient Backlight Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: size === 'lg' ? 12 : 9,
            background: 'radial-gradient(circle at 50% 35%, rgba(0, 242, 254, 0.3) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />

        {/* Vector 3D Faceted Shield SVG */}
        <svg
          width={current.svg}
          height={current.svg}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 8px rgba(0, 242, 254, 0.4))' }}
        >
          <defs>
            {/* Left Facet Gradient */}
            <linearGradient id="shieldLeft" x1="4" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Right Facet Gradient */}
            <linearGradient id="shieldRight" x1="28" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#3730A3" />
            </linearGradient>

            {/* Central AI Quantum Core Gradient */}
            <linearGradient id="aiCore" x1="10" y1="9" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>

            {/* Specular Edge Highlight */}
            <linearGradient id="edgeGlow" x1="16" y1="2" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#00F2FE" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Wing / Primary Shield Facet */}
          <path
            d="M16 2.5L5 6.8V15C5 21.8 9.7 27.2 16 29.5V2.5Z"
            fill="url(#shieldLeft)"
            opacity="0.95"
          />

          {/* Right Wing / Secondary Facet */}
          <path
            d="M16 2.5L27 6.8V15C27 21.8 22.3 27.2 16 29.5V2.5Z"
            fill="url(#shieldRight)"
            opacity="0.9"
          />

          {/* Isometric Inner Bevel Contours */}
          <path
            d="M16 5.5L8 8.8V14.5C8 19.8 11.4 24.2 16 26.2V5.5Z"
            fill="white"
            fillOpacity="0.12"
          />
          <path
            d="M16 5.5L24 8.8V14.5C24 19.8 20.6 24.2 16 26.2V5.5Z"
            fill="black"
            fillOpacity="0.25"
          />

          {/* Outer Specular Edge Rim */}
          <path
            d="M16 2.5L5 6.8V15C5 21.8 9.7 27.2 16 29.5C22.3 27.2 27 21.8 27 15V6.8L16 2.5Z"
            stroke="url(#edgeGlow)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Central AI Nexus Core Diamond / Circuit Node */}
          <g filter="url(#glow)">
            {/* Outer Diamond */}
            <path
              d="M16 9.5L21 14.5L16 19.5L11 14.5L16 9.5Z"
              fill="url(#aiCore)"
              opacity="0.95"
            />
            {/* Center Quantum Pulse Dot */}
            <circle cx="16" cy="14.5" r="2" fill="#FFFFFF" />
          </g>

          {/* Circuit Trace Connectors */}
          <path
            d="M16 19.5V24.5M11 14.5H7.5M21 14.5H24.5M16 9.5V6"
            stroke="#00F2FE"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: current.fontSize,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            License<span style={{ background: 'linear-gradient(135deg, #00F2FE 0%, #818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Shield</span>
          </span>

          {/* High-Tech AI Badge */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: current.badgeSize,
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: '5px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: '#00F2FE',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
              lineHeight: 1,
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}
