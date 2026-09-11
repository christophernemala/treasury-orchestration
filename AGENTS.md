# AGENTS.md — AI Agent Configuration for Treasury Atom

## 1. Identity & Mission
Treasury Atom is an enterprise, high-assurance corporate treasury management platform built with React 19 / Vite + Node.js / Express 5.
- **Base Currency**: `AED` (United Arab Emirates Dirham)
- **Precision**: Exact decimal arithmetic (`Decimal.js` or fixed 2-decimal string math). IEEE 754 floating point numbers are strictly forbidden for balances, journals, and settlements.
- **Security Invariants**: JWT lifetimes capped at 15 minutes, single-use 6-digit dev OTPs, membership-based tenant and legal entity scoping, fail-closed production boundaries, dynamic SSE stream revalidation.

---

## 2. Quick Start & Developer Commands

```powershell
# Install dependencies
npm ci

# Build both client and server
npm run build

# Run local dev server (Express on :4320, Vite client on :5173)
npm run dev

# Run Vitest test suite (56 automated tests)
npm run test

# Run quality checks (build + test)
npm run check

# Execute UAT evidence runbook
node uat/evidence/treasury-atom/scripts/run-treasury-uat-evidence.mjs
```

---

## 3. Key Documentation References

Before creating or editing code, always consult the primary architectural specifications:
- [`REFERENCE.md`](REFERENCE.md): Full REST API contract, SSE stream specs, security invariants, and database schema.
- [`skills.md`](skills.md): Comprehensive index of algorithmic skills and heuristics.
- [`docs/architecture.md`](docs/architecture.md): High-level system topology and state machine.
- [`docs/governance.md`](docs/governance.md): Maker-checker and dual-control policies.
- [`docs/phase-1-production-blueprint.md`](docs/phase-1-production-blueprint.md): Production deployment blueprint.

---

## 4. Architectural Rules & Invariants

1. **Zero-Dependency SQLite Persistence**:
   - Uses Node.js standard library `node:sqlite` (`DatabaseSync`) located in `.runtime/treasury.db`.
   - In-memory database `:memory:` is used for fast, isolated test runs.
2. **Separation of Duties (Maker-Checker)**:
   - High-value transactions, invoice closures, payments, and escrow disbursements require dual control.
   - The user who created the request (`makerId`) cannot approve or execute it (`checkerId !== makerId`).
3. **Tenant & Legal Entity Scoping**:
   - Every read and write validates the active user's legal entity assignments (`legalEntityIds`).
   - Cross-entity linkage is strictly denied with `403 ENTITY_SCOPE_DENIED`.
4. **Fail-Closed Security**:
   - In production (`NODE_ENV=production`), missing identity or persistence adapters immediately fail closed with `503` for application APIs and `404` for dev routes.
   - Development routes (`/api/auth/signup`, `/api/seed`, `/api/v1/dev/reset`) are never exposed in production.
5. **Deterministic Intelligence**:
   - Agents provide explainability, matching proposals, and anomaly alerts.
   - Agents never bypass required human approvals or write unverified transactions to ledgers.
