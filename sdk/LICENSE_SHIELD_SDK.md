# LicenseShield SDK — Agent-to-Agent (A2A) Integration

The SDK ships as a **zero-config TypeScript module** at [`sdk/index.ts`](./index.ts) that you import directly into any Node.js/TypeScript project (a coding agent, CI job, or CLI tool). It wraps the entire pay-per-audit flow so an agent never touches raw ethers, hashing, or HTTP plumbing.

## The A2A Model — How a Coding Agent Uses LicenseShield

```
┌───────────────────────┐         ┌──────────────────────────────┐
│  Coding Agent          │         │  LicenseShield Backend        │
│  (Claude/Cursor/etc.)  │         │  (Next.js API routes)         │
│                        │         │                              │
│  1. wants to npm i X   │         │                              │
│  2. shield.audit(...)  │         │                              │
│        │               │         │                              │
│        │ no API key?   │         │                              │
│        ▼               │         │                              │
│   lockAuditFee() ──────┼────────▶│ Base Sepolia escrow           │
│   $0.01 USDC           │         │ (payloadHash-bound lock)      │
│        │               │         │                              │
│   POST /api/v1/audit ──┼────────▶│ verifyApiKey OR               │
│   X-Audit-ID + exact   │         │ verifyEscrowLock              │
│   body bytes           │         │        │                     │
│        │               │         │        ▼                     │
│        │               │         │  NPM + OSV.dev + Gemini 3.5  │
│        │               │         │        │                     │
│        │◀── verdict ───┼─────────│  APPROVED / FLAGGED JSON      │
│        │               │         │        │                     │
│  3. verdict.status?    │         │        ▼ (Web3 path only)     │
│     proceed : block    │         │  settleAudit() async,         │
│                        │         │  non-blocking                 │
└───────────────────────┘         └──────────────────────────────┘
```

### Two payment paths, one SDK call

| Path | Who uses it | What happens |
|------|-------------|--------------|
| **Model A — SaaS** | Registered agents / CI with an `ls_live_*` key | `Authorization: Bearer <key>` header; monthly quota enforced server-side; no wallet needed |
| **Model B — Web3 escrow** | Anonymous agents, one-shot scripts, machine-to-machine without signup | SDK locks $0.01 USDC on Base Sepolia bound to the exact request body, then calls the API. Backend verifies lock + hash match, then settles asynchronously |

Both paths return the identical `AuditReport` shape.

---

## Quickstart

### 1. Path A — SaaS key (no wallet)

```ts
import { LicenseShieldClient } from './sdk';

const shield = new LicenseShieldClient({
  baseUrl: 'https://your-deployment.example.com',
  apiKey: process.env.LICENSE_SHIELD_KEY, // ls_live_...
});

const report = await shield.audit({
  packages: ['react@18.3.1', 'axios@1.6.0', 'some-gpl-pkg@2.0.0'],
  targetLicense: 'MIT',
});

if (report.status === 'FLAGGED') {
  console.log(report.suggestedAlternatives);
  // agent should stop / pick an alternative package
}
```

### 2. Path B — Web3 escrow (no signup)

```ts
import { LicenseShieldClient } from './sdk';

const shield = new LicenseShieldClient({
  baseUrl: 'https://your-deployment.example.com',
  signerKey: process.env.AGENT_WALLET_PRIVATE_KEY, // funded with USDC + gas
  // escrowAddress optional — auto-learned from the backend's 402 response
});

const report = await shield.audit({
  packages: [{ name: 'left-pad', version: '1.3.0' }],
  targetLicense: 'MIT',
});
```

Under the hood `shield.audit()` does, in order:

1. Generates a random 32-byte `auditId` locally (no server round-trip).
2. Serializes the JSON body **once** and computes `payloadHash = keccak256(utf8Bytes(body))` — the locked hash and the sent body are guaranteed byte-identical.
3. `usdc.approve(escrow, fee)` (skipped if allowance is sufficient) → `escrow.lockAuditFee(auditId, payloadHash)` → waits for 1 confirmation.
4. `POST /api/v1/audit` with the exact body bytes + `X-Audit-ID` header.
5. Returns the parsed verdict. Settlement happens later, backend-side, non-blocking.

If `escrowAddress` is not configured, the SDK learns it (plus fee and chain info) from the backend's HTTP 402 `paymentInstructions` response on first call and caches it.

### 3. Quick check without payment — `verify()`

`POST /api/v1/verify` is the sandbox/pre-flight endpoint for agents that want a fast check before running a full paid audit:

```ts
const res = await shield.verify({
  packages: ['express@4.18.2'],
  command: 'npm install express',   // optional; parsed server-side
  agentId: 'my-coding-agent-v1',
});
// res.status: 'PASS' | 'WARN' | 'FAIL'
// res.score, res.executionProof (sha256 proof hash), res.details per package
```

> ⚠️ Sandbox `verify` calls are rate-limited per IP on the backend. For production agent loops, use `audit()`.

---

## API Reference

### `new LicenseShieldClient(config)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `baseUrl` | `string` | yes | LicenseShield deployment URL |
| `apiKey` | `string` | if no signer | `ls_live_*` SaaS API key (Model A) |
| `signerKey` | `string` | if no apiKey | Wallet private key for on-chain escrow (Model B) |
| `escrowAddress` | `string` | no | Escrow contract address; auto-learned from the 402 response if omitted |
| `usdcAddress` | `string` | no | Override USDC address (default: Base Sepolia USDC) |
| `rpcUrl` | `string` | no | Custom RPC (default: `https://sepolia.base.org`) |
| `timeoutMs` | `number` | no | HTTP + chain timeout (default: 120000) |

### `shield.audit(req: AuditRequest): Promise<AuditReport>`

```ts
interface AuditRequest {
  packages: Array<string | { name: string; version?: string }>;
  targetLicense?: string;   // default 'MIT'
  agentId?: string;         // free-form, logged for traceability
  repository?: string;      // free-form
}
```

Returns a report with `status: 'APPROVED' | 'FLAGGED'`, `reason`, `suggestedAlternatives`, `risks`, `authModel`, and `settlementTxHash` (when settled by call time).

### `shield.verify(req: VerifyRequest): Promise<VerifyResponse>`

Same package format, plus optional `command` (an `npm install ...` string is parsed server-side) and `agentId`.

### `shield.estimateCost(): Promise<{ feeUsd: number; token: string; network: string }>`

Reads `auditFee()` from the escrow contract and converts to USD.

---

## What the Agent Should Do With the Verdict

```ts
const report = await shield.audit({ packages, targetLicense: 'MIT' });

switch (report.status) {
  case 'APPROVED':
    // safe to npm install
    break;
  case 'FLAGGED':
    // block install; surface report.suggestedAlternatives to the user
    break;
}
```

The verdict is deterministic machine output (enforced by Gemini's `responseSchema` plus the rule-engine fallback), so an agent can branch on it without any fuzzy parsing.

## Error Handling

| Error | Meaning | Agent action |
|-------|---------|--------------|
| HTTP 402 | No valid auth/lock | SDK auto-handles via escrow when a signer is configured; otherwise thrown |
| HTTP 429 | Rate limited (sandbox) | Back off and retry, or use the paid path |
| HTTP 400 | Bad payload | Fix the request shape |
| HTTP 5xx | Backend / LLM failure | Retry with backoff — quota was already incremented (known issue, tracked) |

## Rate Limits

Sandbox `verify` calls are rate-limited per IP (20/hour). Paid paths (API key or escrow) are limited only by the key's monthly quota or per-lock payments.

---

## 🔒 Live Interception — the Guard Wrapper

The invisible-in-the-workflow piece: [`sdk/guard.mjs`](./guard.mjs) wraps a package-manager command, checks it against LicenseShield, and only executes the real command on PASS/WARN.

```bash
# explicit wrapper
node sdk/guard.mjs -- npm install axios@1.6.0 left-pad

# what the agent sees on FAIL (exit 1, command never runs):
#   🛑 LICENSESHIELD BLOCKED — score 15/100 | policy MIT
#      ✖ some-gpl-package@latest — license GPL-3.0 conflicts with policy
#      ✖ axios@1.6.0 — 31 known CVEs (e.g. GHSA-35jp-ww65-95wh)
#   💡 Gemini recommendation: Replace flagged dependencies with …
```

### Config (env)

| Variable | Meaning |
|----------|---------|
| `LICENSE_SHIELD_URL` | Backend base URL (default `http://localhost:3001`) |
| `LICENSE_SHIELD_KEY` | `ls_live_*` API key (Model A — recommended for agents) |
| `LICENSE_SHIELD_POLICY` | Target license policy (default `MIT`) |
| `LICENSE_SHIELD_FAIL_CLOSED` | `1` = block commands when the backend is unreachable (default: fail-open with a warning) |
| `LICENSE_SHIELD_AGENT_ID` | Agent identifier logged for traceability |

### Hooking real coding agents

**Claude Code** — add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node /absolute/path/to/sdk/guard.mjs -- $CLAUDE_TOOL_INPUT_COMMAND"
          }
        ]
      }
    ]
  }
}
```

Non-package commands pass through with zero backend calls (~0.2s overhead); `npm/pnpm/yarn/bun install|add` get the full verdict before execution. On FAIL the guard exits 1 with Gemini's alternatives, and the agent rewrites its dependency choice on the spot — exactly the autonomous loop, no dashboard visit.

**Cursor / Gemini CLI / other agents** — same pattern in their respective pre-command hook: run the guard with the command string as arguments and block on non-zero exit.

> Non-package commands (`git status`, `ls`, `node script.js`…) bypass the API entirely — the guard only pays the verification cost for dependency mutations.
