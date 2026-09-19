# LicenseShield AI 🛡️

> **Autonomous Open-Source Security & License Intelligence Engine for AI Coding Agents and Engineering Teams**

LicenseShield AI is an autonomous hybrid security and license intelligence audit engine that protects modern software repositories from unauthorized AI code generation dependencies, copyleft license conflicts, and supply chain CVE vulnerabilities. Powered by **Google Gemini 2.5 Flash** via `@google/genai` and settled on **Base Sepolia** via a dedicated Smart Contract Escrow for Web3 micro-transactions.

---

## 📐 Platform Architecture

```
                             ┌──────────────────────────────────────────────┐
                             │       LicenseShield AI Platform Engine       │
                             └──────────────────────┬───────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴───────────────────────────────────┐
                 ▼                                                                      ▼
       Model A: Web2 SaaS (Human)                                            Model B: Web3 M2M (AI Agents)
    Clerk Auth + Stripe Subscription                                      Bearer Keys / Base Sepolia Escrow
                 │                                                                      │
                 └──────────────────────────────────┬───────────────────────────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │   API Layer (/api/v1/audit)   │
                                    └───────────────┬───────────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                      Concurrent Metadata & Security     Gemini 2.5 Flash Engine
                      • NPM Registry API                 • Strict JSON Output Schema
                      • OSV.dev CVE Ingestion            • Semantic License Analysis
                                    │                               │
                                    └───────────────┬───────────────┘
                                                    ▼
                                     Prisma ORM & Supabase Postgres
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                             [Web2 Response]              [Web3 On-Chain Settle]
                             HTTP 200 OK + Audit JSON     settleAudit(auditId) on Base
```

---

## ⚡ Core Features

- **Dual-Flow Business Model**:
  - **Model A (Web2 SaaS)**: User management with Clerk, automated subscription tiers with Stripe (Free, Pro, Enterprise), and persistent Bearer API keys.
  - **Model B (Web3 M2M)**: Autonomous pay-per-scan micro-settlement ($0.01 USDC) governed by a trustless Base Sepolia smart contract escrow.
- **Deep License Analysis**:
  - Real-time resolution via NPM Registry API.
  - Deterministic SPDX compatibility matrix (MIT, Apache-2.0, BSD vs. GPL, LGPL, AGPL copyleft viral obligations).
  - Semantic LLM parsing via Gemini 2.5 Flash for ambiguous, multi-licensed, or proprietary EULAs.
- **Supply Chain Vulnerability Scanning**:
  - Direct integration with OSV.dev batch vulnerability queries.
  - AI-contextualized CVE severity scoring and concrete drop-in package alternative recommendations.
- **High-Performance UI**:
  - Next.js 16 App Router & React 19.
  - 60 FPS canvas frame-scrubber with Obsidian Glassmorphism aesthetic.
  - Interactive agent playground for simulating agent-intercepted package additions.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime & Framework** | Node.js 18+ / TypeScript 5 / Next.js 16 (App Router) |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide Icons, Three.js |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Database & ORM** | Supabase PostgreSQL + Prisma ORM |
| **Billing & Payments** | Stripe (Subscriptions) + Base Sepolia USDC (Micro-escrow) |
| **Smart Contracts** | Solidity 0.8.20+, OpenZeppelin, Hardhat, Ethers.js v6 |
| **AI Intelligence** | Google Gemini 2.5 Flash via `@google/genai` |
| **Security Telemetry** | NPM Registry API + OSV.dev CVE Database |

---

## 📁 Key File Structure

```
LicenseShield-AI/
├── app/
│   ├── (auth)/                 # Authentication views
│   ├── api/
│   │   ├── v1/verify/route.ts  # Real-time package verification
│   │   ├── v1/audit/route.ts   # Full dependency tree audit endpoint
│   │   ├── billing/checkout/   # Stripe checkout session creation
│   │   ├── webhooks/stripe/    # Stripe webhook handler
│   │   ├── keys/               # API key management
│   │   └── logs/               # Audit log telemetry
│   ├── dashboard/              # User dashboard & analytics
│   ├── layout.tsx              # Root layout with ClerkProvider
│   └── page.tsx                # Obsidian glassmorphic landing page
├── components/
│   ├── AgentPlayground.tsx     # Interactive AI verification playground
│   ├── HybridPricing.tsx       # Dual Web2 + Web3 pricing comparison
│   ├── LicenseShieldScrubber.tsx # 60FPS scroll-canvas animation
│   ├── Navbar.tsx              # Clerk-authenticated navigation header
│   └── ui/                     # Modular glassmorphic UI components
├── contracts/
│   └── LicenseShieldEscrow.sol # Base Sepolia USDC escrow smart contract
├── lib/
│   ├── gemini.ts               # Gemini AI holistic audit engine
│   ├── geminiScanner.ts        # Gemini license & vulnerability parser
│   ├── license-engine.ts       # Deterministic license compatibility engine
│   ├── npm-fetcher.ts          # NPM Registry API client
│   ├── osv-client.ts           # OSV.dev CVE database client
│   ├── payment.ts              # Payment verification (Bearer & Escrow)
│   ├── prisma.ts               # Prisma ORM client
│   └── stripe.ts               # Stripe SDK client
├── prisma/
│   └── schema.prisma           # Database schema (Profile, ApiKey, AuditLog)
└── scripts/
    ├── deploy-escrow.ts        # Hardhat / Solc Base Sepolia escrow deployment
    └── test-hybrid-platform.ts # Comprehensive hybrid test suite
```

---

## ⚙️ Setup & Installation

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Adityakumarsingh/LicenseShield-AI.git
cd LicenseShield-AI
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Supabase PostgreSQL via Prisma)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Smart Contract Deployment (Base Sepolia)
PRIVATE_KEY=0x...
DEPLOYER_WALLET_ADDRESS=0x...
RPC=https://sepolia.base.org
ESCROW_CONTRACT_ADDRESS=0x27ea5e193bA7D7296AC6baa051f58707f8c367a5
TREASURY_WALLET_ADDRESS=0x42B980cCEFF9E8c50E24D9c9a9A0160B5B2b92B4

# Gemini AI Engine
GEMINI_API_KEY=AIzaSy...

# Stripe Billing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
LICENSE_SHIELD_API_KEYS=ls_live_demo_key_998877,ls_test_key_123456
```

### 3. Database Migration

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to launch the platform.

---

## 🧪 Testing & Verification

Run the platform test suite:

```bash
# Run the hybrid platform test suite (Solidity compilation, Model A & Model B verification)
npm run test:hybrid

# Compile the escrow smart contract
npm run compile
```

---

## 🔍 API Usage

### Real-Time Dependency Verification (`POST /api/v1/verify`)

```bash
curl -X POST http://localhost:3000/api/v1/verify \
  -H "Authorization: Bearer ls_live_demo_key_998877" \
  -H "Content-Type: application/json" \
  -d '{
    "packages": ["axios@1.6.0", "lodash@4.17.20"],
    "targetPolicy": "MIT",
    "agentId": "claude-code-subagent"
  }'
```

### Full Audit Engine (`POST /api/v1/audit`)

```bash
curl -X POST http://localhost:3000/api/v1/audit \
  -H "Authorization: Bearer ls_live_demo_key_998877" \
  -H "Content-Type: application/json" \
  -d '{
    "projectLicense": "MIT",
    "dependencies": {
      "axios": "^1.6.0",
      "lodash": "^4.17.20"
    }
  }'
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
