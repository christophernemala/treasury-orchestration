# Treasury Atom

> **Governed Corporate Treasury & Cash Orchestration Platform** — Real-time cash visibility, bank-statement ingestion, transaction review, multi-criteria reconciliation, dual-control approvals, and auditable agent workflows.

---

## ✨ Features & Capabilities

- **Consolidated Cash Visibility**: Real-time multi-bank, multi-currency position calculation with strict segregation of restricted and operating cash.
- **Bank Statement Ingestion**: Automated ingestion and checksum deduplication for MT940, CAMT.053, and Excel bank statements.
- **Intelligent Heuristic Reconciliation**: Rule-based matching engine (exact date, fuzzy date window, reference substring, exact decimal amount).
- **Maker-Checker Dual Control**: Separation of duties with configurable authorization thresholds for payments, adjustments, and reconciliation sign-offs.
- **Real-Time SSE Live Stream**: Authenticated Server-Sent Events (`/api/treasury/live-stream`) delivering sub-second balance updates and approval requests.
- **Deterministic Agent Workflows**: Explainable AI proposals and audit traces without ungrounded ledger writes.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router, TanStack Query, Lucide icons, Framer Motion
- **Backend**: Node.js, Express 5 REST API, Server-Sent Events (SSE)
- **Persistence**: 
  - Local / Fast Test: `node:sqlite` (`DatabaseSync`) located at `.runtime/treasury.db` (or `:memory:`)
  - Production: Supabase / PostgreSQL with Row-Level Security (RLS)
- **Testing**: Vitest with 56 automated unit, security, and reconciliation tests
- **Base Currency**: `AED` (strict zero-float decimal precision)

---

## 📚 Documentation & Technical Specifications

| Document | Purpose |
|---|---|
| [`REFERENCE.md`](REFERENCE.md) | Full REST API contract, SSE stream specification, security invariants, and database schema. |
| [`skills.md`](skills.md) | Catalog of embedded algorithmic skills, mathematical models, and agent invocation patterns. |
| [`AGENTS.md`](AGENTS.md) | AI coding agent configuration, rules of engagement, and architectural invariants. |
| [`docs/architecture.md`](docs/architecture.md) | Comprehensive system architecture and lifecycle state machine. |
| [`docs/governance.md`](docs/governance.md) | Dual-control thresholds and segregation of duties policies. |
| [`docs/phase-1-production-blueprint.md`](docs/phase-1-production-blueprint.md) | Production hardening, cloud rebuild, and deployment guide. |
| [`docs/verification-runbook.md`](docs/verification-runbook.md) | Step-by-step verification and UAT runbook. |

---

## 🧠 Skills Catalog

The platform embeds standardized, reusable financial algorithms documented in [`skills/`](skills/):

- [`skills/treasury-reconciliation/SKILL.md`](skills/treasury-reconciliation/SKILL.md): Bank statement matching heuristics and GL reconciliation.
- [`skills/cash-position-audit/SKILL.md`](skills/cash-position-audit/SKILL.md): Available vs. restricted cash calculation and control totals.
- [`skills/liquidity-forecasting/SKILL.md`](skills/liquidity-forecasting/SKILL.md): Daily (T+7), weekly (T+30), and monthly cash forecasts.
- [`skills/maker-checker-governance/SKILL.md`](skills/maker-checker-governance/SKILL.md): Separation of duties and dual-control sign-offs.
- [`skills/escrow-kriba-management/SKILL.md`](skills/escrow-kriba-management/SKILL.md): Segregated project escrow accounts and milestone releases.

---

## 📁 Repository Structure

```text
treasury-orchestration/
├── client/                     # React 19 / Vite frontend application
│   ├── src/
│   │   ├── components/         # Workspace UI, modals, motion controls
│   │   ├── hooks/              # SSE live-stream hook, API queries
│   │   └── App.tsx             # Main client shell and navigation
├── server/                     # Express 5 REST API & domain services
│   ├── src/
│   │   ├── modules/            # Treasury, reconciliation, platform services
│   │   │   └── platform/       # agentEngine.ts, types.ts
│   │   ├── middleware/         # Auth, tenant scoping, CORS
│   │   └── index.ts            # API server entrypoint
│   └── tests/                  # Vitest suite (56 tests)
├── skills/                     # Domain skills & algorithm specifications
│   ├── treasury-reconciliation/
│   ├── cash-position-audit/
│   ├── liquidity-forecasting/
│   ├── maker-checker-governance/
│   └── escrow-kriba-management/
├── supabase/                   # PostgreSQL migrations with RLS
├── docs/                       # Architecture, security audits, blueprints
├── REFERENCE.md                # Complete API contract & data dictionary
├── skills.md                   # Skills catalog index
├── AGENTS.md                   # AI agent instructions & boundaries
└── README.md                   # Project overview
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ and npm

### Local Setup

```powershell
# 1. Clone repository
git clone https://github.com/christophernemala/treasury-orchestration.git
cd treasury-orchestration

# 2. Configure environment
Copy-Item .env.example .env

# 3. Install dependencies
npm ci

# 4. Start local development (Express API on :4320, Vite Client on :5173)
npm run dev
```

Open your browser at `http://127.0.0.1:5173/app`.

### Authentication for Local Dev
- **User**: `admin@treasury.local`
- **Password**: `Treasury123!`
- *Each login automatically displays a single-use 6-digit development OTP on the screen (no email required).*

---

## 🧪 Testing & Verification

```powershell
# Run all automated tests (56 tests)
npm run test

# Run full quality gates (build + test)
npm run check

# Check API health
Invoke-WebRequest http://127.0.0.1:4320/api/health
```

---

## 🔒 Security Invariants

1. **Zero Floating Point Math**: IEEE 754 floats are banned; all amounts use exact 2-decimal arithmetic.
2. **Short-Lived JWTs**: Session tokens expire after 15 minutes.
3. **Tenant & Entity Scoping**: Reads and writes validate the user's explicit legal entity assignments (`403 ENTITY_SCOPE_DENIED` on violation).
4. **Dual-Control Invariant**: A maker can never approve their own proposed action.
5. **Fail-Closed in Production**: Missing credentials or unverified origins reject all requests with `503`.
