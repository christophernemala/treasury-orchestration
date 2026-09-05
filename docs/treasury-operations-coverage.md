# Treasury operations coverage

This matrix separates working application behavior from integration contracts. “Operational locally” means the workflow executes against the authenticated development repository and writes audit events where implemented. It does not mean a bank, ERP, custodian, or messaging provider is connected.

| Treasury operation | Current capability | State source | Production dependency |
| --- | --- | --- | --- |
| Cash-position visibility | Account and currency positions, SSE refresh | Development repository | Bank/API or reviewed statement feeds |
| Transaction ledger | Search, filter, create, edit, admin delete, CSV export | REST API | Durable PostgreSQL repository |
| Reconciliation | Suggestions, human match/exception decision, audit event | REST API | ERP/GL connector and independent verifier |
| Unapplied cash | List, create, assign/update investigation | REST API | Remittance and customer master integrations |
| Bank statements | Statement records and review status | REST API | CSV/XLSX parser, private object storage, bank-specific validation |
| Payments | Read-only lifecycle tracking | Platform API | Bank connectivity, sanctions controls, signing and maker-checker gate |
| Liquidity and balances | Dashboard aggregation | Development records | Validated bank feeds and FX-rate service |
| Legal entities | Entity-scoped master records | Platform API | Production identity and organization mapping |
| Escrow | Provider-neutral contract and approval proposal | Platform API | Validated provider adapter; no current release capability |
| Approvals | Maker-checker records and review surface | Platform API | Durable expiring approval tokens and signer |
| Audit | Correlated local events | In-memory/API records | Append-only external receipt sink |
| Finance communication agent | Journey and message preview, approval routing | Client state | Customer.io server adapter, consent, credentials and delivery receipts |
| Month-end close checklist | Dashboard signals only | Aggregated API state | Durable close-period/task endpoints and evidence storage |
| Forecasting, FX, debt, investments and guarantees | Not implemented | — | Market data, policy configuration and dedicated domain services |

## Production completion order

1. Replace local identity and in-memory state with Supabase Auth/PostgreSQL and enforce organization/entity RLS.
2. Implement bank statement CSV/XLSX normalization with file hashes, validation receipts, duplicate detection and private evidence storage.
3. Add ERP/GL read adapters and independently verify reconciliation outcomes before any posting capability.
4. Add durable close periods, checklist ownership, evidence linkage, approvals and signed audit receipts.
5. Introduce bank/payment adapters only after sanctions, limits, dual approval, idempotency, expiry and rollback/recall rules are tested.
6. Add FX exposure, cash forecasting, debt, investments, guarantees and counterparty-risk domains as separately tested modules.

## Truth boundary

Seeded values are retained so the local application can be exercised without private financial data. They are always labeled as development or illustrative values. Removing that disclosure would create a false operational claim; replacing them with real data requires reviewed connectors and user-owned credentials.
