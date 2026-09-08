# Treasury Atom UAT Evidence Pack

**Repository:** `christophernemala/treasury-orchestration`  
**Prepared date:** 2026-09-07  
**Scope:** Treasury Atom cash visibility, bank statement ingestion, transaction review, reconciliation, GL matching, payment allocation, month-end close controls, refresh resilience, schema controls, and authorization.

## Purpose

This pack gives Treasury, Finance Control, and Product reviewers a runnable UAT record before Treasury Atom is used for production financial data, management reporting, close decisions, or external mutations.

It covers:

- Normal bank transactions, duplicate statement lines, missing fields, credits/outflows, partial receipts, disputed items, future value dates, stale settlement promises, and multi-currency balances.
- Bank source, normalized transaction ledger, GL journal matching, allocation, liquidity dashboard, and month-end close control totals.
- Refresh failure, changed schema, blank outputs, and unauthorized override scenarios.
- Defect severity, retest evidence, release decision, and sign-off fields.

## Repository Controls Used

The pack is aligned to the current repository evidence:

- `README.md`: Treasury Atom is a governed month-end workspace with local transaction CRUD, reconciliation decisions, unapplied-cash workflows, CSV export, authenticated SSE updates, and audit records.
- `docs/treasury-operations-coverage.md`: current behavior is local and illustrative; live bank, ERP/GL, payment, object-storage, communication, and forecast domains require production connectors.
- `docs/phase-1-production-blueprint.md`: production release remains no-go until identity, tenancy, persistence, durable audit, idempotency, evidence storage, and deployment controls are remediated.
- `server/src/services/reconciliation.ts`: match scoring uses currency, amount, date, and exact reference; suggestions require score >= 60.
- `server/tests/reconciliation.test.ts`: exact match scores 100 and weak candidates are rejected.

## Files

| File | Use |
|---|---|
| `uat-test-cases.csv` | Business UAT register with steps, expected results, severity, and sign-off fields. |
| `control-totals.csv` | Fixed totals to reconcile bank source, normalized ledger, GL matches, allocations, liquidity, and close schedule. |
| `defects-and-retests.csv` | Defect log, severity, owner, fix, retest result, and release decision. |
| `signoff-sheet.csv` | Treasury, Finance Control, Security, Product, and Release sign-off fields. |
| `fixtures/treasury-atom-uat-fixture.json` | Deterministic source records and expected outcomes. |
| `scripts/run-treasury-uat-evidence.mjs` | Offline runner that validates scenarios and writes evidence. |

## Run

```bash
cd uat/evidence/treasury-atom
node scripts/run-treasury-uat-evidence.mjs
```

Output is written to:

```text
uat/evidence/treasury-atom/evidence-output/treasury-atom-uat-results.json
uat/evidence/treasury-atom/evidence-output/treasury-atom-uat-summary.csv
uat/evidence/treasury-atom/evidence-output/treasury-atom-control-total-results.csv
```

## Release Gate

Treasury Atom can move from prototype UAT to controlled pilot only when:

- Critical reconciliation differences are `0.00` or formally approved.
- All Critical and High defects are resolved and retested as Passed.
- Users can refresh, filter, trace, explain, and export outputs without developer assistance.
- Unauthorized overrides and payment mutations remain blocked.
- Signed UAT evidence and operating guide are retained.

Production financial use remains blocked until the production blueprint no-go items are closed.

