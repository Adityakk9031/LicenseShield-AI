# LicenseShield AI 🛡️

> **CROO Agent Hackathon Submission** — Data & Verification / Dev Tooling Track

An autonomous AI agent that audits npm dependency trees for license conflicts and known CVEs, powered by **Gemini 2.5 Flash** and settled on-chain via the **CROO Agent Protocol (CAP)** on Base Sepolia Testnet.

---

## 📐 Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │           LicenseShield AI System            │
                        │                                              │
  Buyer Agent ─────────►│  Next.js API /api/audit                     │
  (npm script /         │         │                                    │
   CROO WebSocket)      │         ▼                                    │
                        │  ┌─────────────────────┐                    │
                        │  │   Audit Pipeline     │                    │
                        │  │                      │                    │
                        │  │ 1. NPM Registry API  │ ← license tags     │
                        │  │ 2. OSV.dev Batch API │ ← CVE data         │
                        │  │ 3. Gemini 2.5 Flash  │ ← AI analysis      │
                        │  │    (geminiScanner)   │   per-package      │
                        │  │ 4. runAIAudit()      │ ← holistic verdict │
                        │  └─────────────────────┘                    │
                        │         │                                    │
                        │         ▼                                    │
                        │  agentClient.deliverOrder()                  │
                        │         │                                    │
                        └─────────┼────────────────────────────────────┘
                                  │
                                  ▼
                        Base Sepolia Testnet (CROO CAP)
                        ← No custom Solidity contracts →
                          Built-in AA wallet escrow
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ / TypeScript 5 |
| **Web Framework** | Next.js 16 (App Router) |
| **AI Engine** | Google Gemini 2.5 Flash via `@google/genai` |
| **Blockchain** | CROO CAP SDK (`@croo-network/sdk`) on Base Sepolia |
| **License DB** | NPM Registry API (unauthenticated) |
| **CVE DB** | OSV.dev Batch API (unauthenticated) |
| **Styling** | Vanilla CSS — 3D cinematic animations, glassmorphism |

All external services are **100% free-tier** — no paid API keys required except Gemini (free quota).

---

## 🚀 CAP SDK Methods Utilized

| Method | Purpose |
|--------|---------|
| `new AgentClient(config, sdkKey)` | Initialize provider agent |
| `agentClient.connectWebSocket()` | Persistent event stream from CROO network |
| `stream.on(EventType.NegotiationCreated, ...)` | Receive buyer order requests |
| `agentClient.getNegotiation(id)` | Fetch negotiation + buyer requirements payload |
| `agentClient.acceptNegotiation(id)` | Accept + trigger on-chain `createOrder` |
| `agentClient.rejectNegotiation(id, reason)` | Reject invalid/capacity-exceeded requests |
| `agentClient.getOrder(id)` | Retrieve order after escrow confirmation |
| `stream.on(EventType.OrderPaid, ...)` | Trigger audit on-chain payment confirmation |
| `agentClient.deliverOrder(id, req)` | Deliver structured audit report on-chain |
| `stream.on(EventType.OrderCompleted, ...)` | Confirm final settlement |
| `stream.onAny(...)` | Debug catch-all event listener |

### A2A Event Lifecycle

```
Buyer                                LicenseShield AI Provider
  │                                          │
  ├─ negotiateOrder({ requirements: JSON }) ►│
  │                                          ├─ NegotiationCreated
  │                                          ├─ getNegotiation() → parse payload
  │                                          ├─ acceptNegotiation() ──► on-chain createOrder
  │◄── EventType.OrderCreated ───────────────┤
  ├─ payOrder() ──────────────────────────────────────────────► Base Sepolia escrow
  │                                          │◄── EventType.OrderPaid
  │                                          ├─ NPM Registry fetch (licenses)
  │                                          ├─ OSV.dev batch query (CVEs)
  │                                          ├─ Gemini 2.5 Flash per-package scan
  │                                          ├─ runAIAudit() holistic verdict
  │                                          ├─ deliverOrder({ schema: AuditReport })
  │◄── EventType.OrderCompleted ─────────────┤
  ├─ getDelivery() → receive audit JSON      │
```

---

## 📁 Project Structure

```
LicenseShield AI/
├── app/
│   ├── api/audit/route.ts     # Next.js API route — web UI audit entry point
│   ├── page.tsx               # Homepage with 3D animated audit UI
│   ├── vault/page.tsx         # License Vault (browse audited packages)
│   └── reports/page.tsx       # Reports dashboard
│
├── lib/
│   ├── agentDaemon.ts         # ★ CROO CAP SDK persistent daemon (A2A provider)
│   ├── agent-loop.ts          # Reusable agent loop module
│   ├── geminiScanner.ts       # ★ Gemini 2.5 Flash sub-module (license + CVE parsing)
│   ├── gemini.ts              # Holistic Gemini AI audit function
│   ├── croo-cap.ts            # CROO settlement for web API route
│   ├── license-engine.ts      # Deterministic license compatibility matrix
│   ├── npm-fetcher.ts         # NPM Registry API integration
│   ├── osv-client.ts          # OSV.dev batch query integration
│   └── types.ts               # Shared TypeScript interfaces
│
├── scripts/
│   ├── test-buyer-agent.js    # ★ Automated A2A end-to-end test runner
│   └── run-agent.ts           # Agent daemon entrypoint
│
└── .env                       # Environment variables
```

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- A free [CROO Dashboard](https://croo.network) account with an SDK key
- A free [Google AI Studio](https://aistudio.google.com) Gemini API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd LicenseShield\ AI
npm install
```

### 2. Configure Environment

```env
# .env
GEMINI_API_KEY=AIzaSy...          # Google AI Studio → free tier
CROO_SDK_KEY=croo_sk_...          # CROO Dashboard → provider SDK key
CROO_API_URL=https://api.croo.network
CROO_WS_URL=wss://api.croo.network/ws
RPC=https://sepolia.base.org
```

### 3. Run

```bash
# Terminal 1 — Web UI + API
npm run dev

# Terminal 2 — CROO Agent Daemon (A2A provider)
npm run agent

# Terminal 3 — Run automated test suite
npm run test:agent
```

---

## 🧪 Test Suite

The `scripts/test-buyer-agent.js` simulates three real-world buyer scenarios:

| Scenario | Description | Expected |
|----------|-------------|----------|
| **A** | `colors@1.4.1` (protestware CVEs) + `lodash@4.17.20` (prototype pollution) | `FLAGGED` |
| **B** | `chalk@5.3.0` + `dotenv@16` + `zod@3` (clean, MIT-compatible) | `APPROVED` |
| **C** | Proprietary project with potentially copyleft dependencies | `APPROVED` (policy-dependent) |

```bash
npm run test:agent
```

---

## 🔍 Gemini 2.5 Flash Integration

### License Parser (`lib/geminiScanner.ts`)

```typescript
// Parse ambiguous/custom license text
const verdict = await parseLicenseText(
  'MIT OR GPL-3.0-only',  // rawLicenseText
  'MIT',                   // projectLicense
  'some-package'           // packageName
);
// → { status: 'FLAGGED', reason: '...', suggestedAlternatives: ['chalk', 'colorette'] }
```

### Vulnerability Contextualizer (`lib/geminiScanner.ts`)

```typescript
// Contextualize OSV vulnerability data
const verdict = await analyzeVulnerabilities(
  'lodash', '4.17.20', osvVulns, 'MIT-licensed dependency'
);
// → { status: 'FLAGGED', reason: 'Prototype pollution (HIGH)...', suggestedAlternatives: ['radash'] }
```

Both functions enforce `responseMimeType: "application/json"` with a strict `responseSchema` ensuring **100% machine-parseable output**.

---

## 📊 Audit Report Schema

```typescript
interface AuditReport {
  status: 'APPROVED' | 'FLAGGED';
  risks: {
    package: string;
    type: 'LICENSE' | 'VULNERABILITY';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    detail: string;
  }[];
  suggestions: string[];
  aiAnalysis: string;           // Gemini holistic summary
  perPackageInsights: {         // Per-package Gemini verdicts
    package: string;
    resolvedLicense: string;
    geminiLicenseVerdict?: ScannerVerdict;
    geminiVulnVerdict?: ScannerVerdict;
  }[];
  scannedAt: string;            // ISO timestamp
  orderId: string;              // CROO order ID
  agentVersion: string;
}
```

---

## 🌐 Free-Tier Services Used

| Service | Usage | Cost |
|---------|-------|------|
| [NPM Registry](https://registry.npmjs.org) | License + version resolution | Free |
| [OSV.dev](https://osv.dev) | Vulnerability database queries | Free |
| [Google AI Studio](https://aistudio.google.com) | Gemini 2.5 Flash API | Free quota |
| [CROO Network](https://croo.network) | A2A order settlement on Base Sepolia | Free testnet |
| [Base Sepolia](https://sepolia.base.org) | On-chain escrow (testnet) | Free |

---

## 📜 License

MIT — See [LICENSE](LICENSE)

---

*Built for the CROO Agent Hackathon — Data & Verification / Dev Tooling Track*
