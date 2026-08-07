# LicenseShield AI — Hybrid DESIGN.md

> **Hybrid Design System**: Synthesized from **Linear.app** (Dark Mode, Glowing Accents & Precision UI), **Resend** (Clean Developer API & Monospace Code Formatting), and **Coinbase** (Web3 Security & On-Chain Financial Trust).

---

## 🎨 1. Color System

### Primary & Dark Mode Surfaces (Linear + Resend)
- **Background Root**: `#050507` (Deep Obsidian Void)
- **Surface 0 (Void)**: `#000000`
- **Surface 1 (Card Base)**: `rgba(255, 255, 255, 0.025)`
- **Surface 2 (Elevated)**: `rgba(255, 255, 255, 0.05)`
- **Surface 3 (Hover)**: `rgba(255, 255, 255, 0.08)`

### Brand Accents (Linear + Resend)
- **Electric Violet (Primary Accent)**: `#7c3aed`
- **Violet Glow**: `rgba(124, 58, 237, 0.25)`
- **Violet Light Text**: `#a78bfa`
- **Emerald Green (Success / Web3 Live)**: `#10b981`
- **Emerald Glow**: `rgba(16, 185, 129, 0.20)`
- **Emerald Light Text**: `#34d399`

### Web3 & Financial Trust (Coinbase)
- **Coinbase / Base Blue**: `#0052ff`
- **USDC Currency Amber**: `#f59e0b`
- **On-Chain Settled Green**: `rgba(16, 185, 129, 0.12)`
- **Flagged Risk Crimson**: `#f43f5e` / `#fb7185`

### Borders & Dividers (Resend)
- **Border Subtle**: `rgba(255, 255, 255, 0.06)`
- **Border Default**: `rgba(255, 255, 255, 0.10)`
- **Border Strong / Active**: `rgba(124, 58, 237, 0.35)`

---

## 🔤 2. Typography Hierarchy (Resend + Linear)

- **Sans-Serif (Body & Headers)**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace (Code & Hashes)**: `'JetBrains Mono', 'Courier New', monospace`

### Typography Scales
- **Display Hero**: `clamp(64px, 10vw, 140px)`, Weight 900, Line Height `0.88`, Letter Spacing `-0.05em`
- **Section Heading**: `clamp(32px, 4vw, 56px)`, Weight 900, Letter Spacing `-0.04em`
- **Card Title**: `18px - 24px`, Weight 800, Letter Spacing `-0.03em`
- **Body Regular**: `14px - 15px`, Weight 400/500, Line Height `1.6`
- **Code / Monospace**: `12px - 13px`, Weight 500/700, Letter Spacing `0.02em`

---

## 📐 3. Layout, Glassmorphism & Elevation (Linear)

### Glassmorphic Card Specs
```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(124, 58, 237, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 58, 237, 0.15);
}
```

---

## 🎯 4. Interactive Motion & Arrow Animation Specs (Studio Size Video Motion)

All interactive action buttons, CTAs, and links feature a **Studio Size motion arrow effect**:

### Motion Specs
- **Default State**: Arrow icon `→` or `↗` is positioned neatly inside the button badge or text container.
- **Hover State**: 
  - Button lifts `-2px` with ease-out curve.
  - Arrow icon translates `+4px` horizontally (`translateX(4px)`), or `+3px, -3px` for external arrows (`translate(3px, -3px)`).
  - Subtle background glow appears behind the arrow circle pill container.

```css
.arrow-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.arrow-btn .arrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease;
}

.arrow-btn:hover .arrow-icon {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.2);
}
```

---

## ⚡ 5. Web3 & On-Chain Financial Badges (Coinbase)

- **Escrow Settlement Status**:
  ```css
  .badge-escrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.08);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  ```
- **x402 Protocol Micro-payment Badge**: $0.01 USDC Escrow pill tag on Base Sepolia.

---

## 🛡️ 6. License & Vulnerability Risk Matrix (Sentry)

- **APPROVED (Clean)**: Emerald pill (`#10b981`), glowing green status dot.
- **WARNING (Dual-license)**: Amber pill (`#f59e0b`), yellow warning badge.
- **FLAGGED (Violation / Copyleft)**: Rose/Crimson pill (`#f43f5e`), red alert border.
