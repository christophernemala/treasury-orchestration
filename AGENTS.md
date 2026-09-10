# AGENTS.md — Treasury Atom Architecture & Guidelines

## Identity & Mission
Treasury Atom is a high-assurance corporate treasury management application built with React/Vite + Express.
- Default Base Currency: `AED`
- Precision: Exact decimal arithmetic (`Decimal.js` or fixed 2-decimal string math). No IEEE 754 float rounding for balances or ledgers.
- Security Invariants: JWT lifetimes capped at 15 minutes, single-use 6-digit dev OTPs, membership-based tenant and legal entity scoping, fail-closed production boundaries, dynamic SSE stream revalidation.

## Core Commands
- Build all: `npm run build`
- Run local dev server: `npm run dev` (Runs Express API on `:4320` and Vite client on `:5173`)
- Run tests: `npm run test`
- Build & test check: `npm run check`
- UAT evidence check: `node uat/evidence/treasury-atom/scripts/run-treasury-uat-evidence.mjs`

## Architectural Rules
1. **Zero-Dependency SQLite Persistence**:
   - Uses Node.js standard library `node:sqlite` (`DatabaseSync`) located in `.runtime/treasury.db`.
   - In-memory database `:memory:` is used for fast, isolated test runs.
2. **Separation of Duties (Maker-Checker)**:
   - High-value transactions, invoice closures, payments, and escrow disbursements require dual control.
   - The user who created the request (`makerId`) cannot approve or execute it (`checkerId != makerId`).
3. **Tenant & Entity Scoping**:
   - Every read and write validates the active user's legal entity assignments (`legalEntityIds`).
   - Cross-entity linkage (e.g. associating an invoice from Entity A with a customer in Entity B) is rejected with `403 ENTITY_SCOPE_DENIED`.
4. **Fail-Closed Security**:
   - In production (`NODE_ENV=production`), missing identity or persistence adapters immediately fail closed with `503` for application APIs and `404` for dev routes.
   - Development routes (`/api/auth/signup`, `/api/seed`, `/api/v1/dev/reset`) are never exposed in production.
5. **Deterministic Intelligence**:
   - Agents provide explainability, matching proposals, and anomaly alerts.
   - Agents never bypass required human approvals or write unverified transactions to ledgers.
