# Treasury Atom UI architecture

## Decision

Treasury Atom uses React 19, TypeScript and Vite for the authenticated client. Express 5 remains
the API and security boundary. This is the lowest-risk architecture because authentication,
entity scoping, rate limits, server-sent events and maker-checker controls already exist in the
server application.

VibeUI is a design-reference library. No code, script or runtime dependency is loaded from the
VibeUI website.

## Application shell

The interface uses a light sidebar and a persistent context bar. Treasury modules remain grouped
by purpose:

1. Workspace: overview, cash and liquidity, bank imports and approvals.
2. Operations: collections and settlements, outbound payments and escrow monitoring.
3. Intelligence: reports and agent activity.
4. System: connections and settings.

The shell provides orientation only. Authorization is always enforced by the API and database,
never by hiding a navigation item.

## Bank import and reconciliation workspace

The reconciliation screen is a three-pane review workspace:

| Pane | Purpose | Data boundary |
|---|---|---|
| Workflow rail | Show upload, validation, reconciliation and checker stages | Presentation of server-controlled state |
| Statement batches | Search, filter and select authorized statement batches | Tenant and legal-entity scoped API response |
| Source evidence | Show source, balances, timestamps and integrity checksum | Read-only evidence from the selected batch |

No transaction, journal or payment is mutated when a user selects a batch. Controlled mutations
must use authenticated endpoints, an idempotency key, role and entity checks, and immutable audit
logging.

## Financial presentation

Client-side financial aggregation uses integer minor units through `client/src/utils/money.ts`.
Floating-point arithmetic is prohibited for monetary totals. Server-calculated strings remain the
authoritative values.

All financial values use:

- Explicit currency codes.
- Two-decimal fixed precision.
- Tabular numerals.
- Right alignment in comparison tables.
- A safe zero display when an invalid presentation value is received.

## Agent presentation contract

Agent recommendations must render in four distinct sections:

1. Verified source facts.
2. Deterministic rule results.
3. Agent interpretation.
4. Proposed human action.

The interface must not display an agent recommendation as an approval, settlement confirmation,
bank instruction or general-ledger posting.

## Responsive behavior

- Wide desktop: workflow rail, data table and evidence pane remain visible.
- Medium viewport: evidence moves below the workflow and table.
- Mobile: panes stack in workflow order and tables remain horizontally scrollable.
- Reduced-motion preferences remove non-essential transitions.

## Acceptance checks

- The production client compiles with TypeScript strict checks.
- Server tests remain green.
- Monetary totals do not use `parseFloat`, `Number` or native addition.
- Empty states contain no invented balances or transaction facts.
- Source evidence is read only.
- Agent copy states that approval and execution remain human controlled.
- All status meaning remains understandable without color.
