# LicenseShield AI — Development Context Summary
> Last Updated: 2026-09-17 | Conversation ID: 6b968d8d-6883-44c6-9130-cde7460c45b1

---

## 📋 Project Overview

**LicenseShield AI** is an autonomous open-source security & license intelligence engine for AI coding agents. It intercepts AI-generated package dependencies in real-time, detects copyleft license conflicts, CVE supply chain attacks, and verifies compliance proofs before code merges into production.

**Settled on Base Sepolia** via a Smart Contract Escrow for Web3 micro-payments.

---

## 🏗️ Architecture

### Dual-Flow System
1. **Web2 Dashboard (Human Users)** — Powered by **Clerk** auth. Standard SaaS with Stripe billing.
2. **Web3 M2M Flow (AI Agents/CLI)** — Powered by Bearer API keys. Micro-transactions settled on Base Sepolia ($0.001 USDC per scan).

### Tech Stack
- **Framework**: Next.js 16.2.10 (App Router, Turbopack)
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase PostgreSQL (via Prisma)
- **Payments**: Stripe (Web2 SaaS) + Base Sepolia USDC (Web3)
- **Smart Contract**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` on Base Sepolia (84532)
- **Styling**: Tailwind CSS v4 + custom `globals.css` (Obsidian Glassmorphism design system)
- **Fonts**: Inter, Space Grotesk, JetBrains Mono (Google Fonts)

---

## 🎨 UI Design System — "Obsidian Glassmorphism"

### Color Palette (CSS Variables in `globals.css`)
| Variable | Value | Usage |
|---|---|---|
| `--bg-void` | `#020408` | Primary dark background |
| `--bg-obsidian` | `#04060A` | Secondary background |
| `--cyan` | `#00E5F0` | Primary accent |
| `--cyan-bright` | `#00F2FE` | Highlights & glows |
| `--indigo` | `#818CF8` | Secondary accent |
| `--indigo-deep` | `#6366F1` | Buttons & borders |
| `--emerald` | `#34D399` | Success / live indicators |
| `--violet-light` | `#A78BFA` | Tertiary accent |

### Key Components
- **`LicenseShieldScrubber`** — 60FPS canvas-based scroll animation (240 frames). Background is `transparent` so animation bleeds through all sections.
- **`OverlayHero`** — Hero section with glassmorphic pill, gradient headings, CLI copy bar.
- **`AgentPlayground`** — Interactive AI agent verification sandbox.
- **`OverlayMetrics`** — Live telemetry stats section.
- **`OverlayDrawer`** — Interactive backend console / audit inspector drawer.
- **`HybridPricing`** — Web2 (Stripe) + Web3 (Base USDC) dual pricing cards.
- **`Footer`** — Fully transparent footer (background animation visible through).
- **`BrandLogo`** — Premium SVG shield with neon cyan/indigo gradients + circuitry.
- **`Navbar`** — Fixed glassmorphic header with Clerk auth state (SignIn/SignUp/UserButton).

---

## 🔑 Authentication (Clerk)

### Setup
- Provider: `ClerkProvider` wraps root `app/layout.tsx`
- Route Protection: `proxy.ts` (Next.js 16 convention, replaces `middleware.ts`)
- Protected Routes: `/dashboard`, `/dashboard/keys`, `/dashboard/logs`

### Environment Variables Required
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Auth Flow
- **Signed Out**: Navbar shows `Sign In` + `Start Free →` buttons (Clerk modal mode)
- **Signed In**: Navbar shows `Dashboard` pill link + `UserButton` avatar
- Dashboard layout uses `useUser()` and `useClerk()` hooks for session + sign-out

---

## 💳 Payments

### Web2 (Stripe)
- Monthly SaaS subscriptions
- Plans: Free ($0), Pro Team ($49/mo), Enterprise ($299/mo)
- `STRIPE_PRO_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID` in `.env`

### Web3 (Base Sepolia USDC)
- Pay-per-scan at $0.001 USDC
- Escrow Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Network: Base Sepolia (Chain ID: 84532)
- `AuthModal` has a `web3` tab showing escrow details

---

## 🛡️ License Compliance Engine

### API Endpoint: `POST /api/v1/verify`
Verifies npm packages for:
- License type (MIT, Apache-2.0, GPL, LGPL, AGPL, etc.)
- SPDX compliance
- OSV.dev CVE vulnerability lookup
- Policy enforcement (copyleft detection)

### API Endpoint: `GET /api/v1/audit`
Full dependency audit with:
- Model A Bearer API Key authentication (Web2 SaaS)
- Results saved to Supabase `audit_logs` table

---

## 📁 Key File Structure

```
d:\LicenseShield AI\
├── app/
│   ├── layout.tsx              # Root layout with ClerkProvider + Google Fonts
│   ├── page.tsx                # Home page — orchestrates all overlay components
│   ├── globals.css             # Obsidian design system (CSS vars, components)
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard shell with Clerk useUser/useClerk
│   │   └── page.tsx            # Dashboard overview
│   ├── (auth)/
│   │   ├── login/page.tsx      # Legacy login page (now handled by Clerk modals)
│   │   └── signup/page.tsx     # Legacy signup page (now handled by Clerk modals)
│   └── api/
│       ├── v1/verify/route.ts  # License compliance verification
│       ├── v1/audit/route.ts   # Full audit API
│       ├── logs/route.ts       # Audit logs retrieval
│       └── keys/route.ts       # API key management
├── components/
│   ├── Navbar.tsx              # Fixed glassmorphic header with Clerk auth
│   ├── Footer.tsx              # Transparent footer
│   ├── LicenseShieldScrubber.tsx  # 60FPS scroll-canvas animation
│   ├── AgentPlayground.tsx     # AI agent verification sandbox
│   ├── HybridPricing.tsx       # Dual Web2+Web3 pricing cards
│   ├── AuditResultsView.tsx    # Compliance scan results display
│   └── ui/
│       ├── OverlayHero.tsx     # Hero section
│       ├── OverlayMetrics.tsx  # Live telemetry stats
│       ├── OverlayDrawer.tsx   # Backend console drawer
│       ├── AuthModal.tsx       # API Key + Web3 modal (NOT auth — that's Clerk)
│       └── BrandLogo.tsx       # Premium SVG shield logo
├── proxy.ts                    # Clerk middleware (Next.js 16 "proxy" convention)
├── public/
│   ├── frames/                 # 240 JPEG frames for scroll animation
│   └── images/                 # Static assets
└── .env                        # Environment variables (see below)
```

---

## ⚙️ Environment Variables (`.env`)

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Smart Contract (Base Sepolia)
PRIVATE_KEY=0x...
DEPLOYER_WALLET_ADDRESS=0x...
RPC=https://sepolia.base.org
ESCROW_CONTRACT_ADDRESS=0x27ea5e193bA7D7296AC6baa051f58707f8c367a5
TREASURY_WALLET_ADDRESS=0x42B980cCEFF9E8c50E24D9c9a9A0160B5B2b92B4

# Gemini AI
GEMINI_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Web2 API Keys
LICENSE_SHIELD_API_KEYS=ls_live_demo_key_998877,ls_test_key_123456

# Supabase (for audit_logs table)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Clerk (NEW — added in this session)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHJlcGFyZWQtZmlzaC02OTY3LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_xuu8ucgMrJRcD7HiWhPWuBzvo2MaHouJ0hONEbZT2I
```

---

## 🚀 What Was Built in This Session

### 1. Clerk Auth Migration
- Installed `@clerk/nextjs`
- Wrapped root layout in `<ClerkProvider>`
- Replaced Supabase auth in `Navbar.tsx` with Clerk's `SignInButton`, `SignUpButton`, `UserButton`
- Dashboard `layout.tsx` now uses `useUser()` + `useClerk()` instead of Supabase session
- `proxy.ts` created (Next.js 16 replaces `middleware.ts` with `proxy.ts`)
- `middleware.ts` deleted (caused conflict)

### 2. UI Transparency & Canvas Animation
- `LicenseShieldScrubber` background set to `transparent`
- `app/page.tsx` root div background set to `transparent`  
- Footer verified transparent (animation visible behind it)
- Restored critical `html` and `body` CSS rules in `globals.css`

### 3. AuthModal Split
- Removed all Supabase auth from `AuthModal.tsx`
- Modal now only handles: **API Key generation** + **Web3 escrow** tab
- Human auth (Sign In / Sign Up) fully delegated to Clerk

### 4. CSS Fixes
- Fixed `@import` order in `globals.css` (Google Fonts must precede Tailwind import)
- Restored `html { background-color, font-family }` and `body { background-color }` rules

### 5. New Components Built
- `AgentPlayground.tsx` — Live AI agent verification demo
- `HybridPricing.tsx` — Dual Web2+Web3 pricing section
- `LicenseShieldScrubber.tsx` — 60FPS scroll animation wrapper
- `OverlayHero.tsx`, `OverlayMetrics.tsx`, `OverlayDrawer.tsx` — Page overlay sections
- `BrandLogo.tsx` — Premium SVG vector logo
- `AuthModal.tsx` — API Key + Web3 modal

---

## 🐛 Known Issues / Next Steps

1. **`(auth)/login` and `(auth)/signup` pages** — Still contain legacy Supabase code. These routes are now unused since Clerk handles auth via modals. Can be deleted or repurposed.
2. **API routes** (`/api/logs`, `/api/keys`, `/api/keys/regenerate`, `/api/keys/revoke`) — Still use `supabase.auth.getSession()` for bearer auth. Should be migrated to Clerk's `auth()` server helper when API auth is needed.
3. **Web3 M2M SDK** — Not yet implemented. Next step is building the NPM SDK for programmatic agent access.
4. **Logo Image** — AI image generation hit rate limits. Current logo is a premium SVG in `BrandLogo.tsx`. Could swap for a generated PNG when quota resets.
5. **Prisma Schema** — Defined but not migrated. Run `npx prisma db push` when ready.

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production  
npm run build

# Prisma
npx prisma studio
npx prisma db push
npx prisma generate
```

---

*This file was auto-generated by Antigravity AI assistant to preserve context across sessions.*
