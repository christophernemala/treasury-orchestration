# Treasury Atom governance boundary

Treasury Atom currently runs as a development workspace. Its assistant may read current application state, summarize it, and propose the next review step. It must not represent a bank or ERP connection as active and must not initiate payments or production ledger postings.

## Mutation matrix

| Action | Assistant | Human reviewer | Current enforcement |
| --- | --- | --- | --- |
| Read dashboard and evidence metadata | Allowed | Allowed | Authenticated API |
| Explain reconciliation state | Allowed | Allowed | Deterministic client summary |
| Propose a review step | Allowed | Allowed | Propose-only UI |
| Change local transaction or reconciliation state | Not autonomous | Allowed | Authenticated endpoint and audit event |
| Initiate payment or post to ERP | Denied | Denied | No connector exists |

## Runtime health contract

`GET /api/health` reports process readiness. `GET /api/health/runtime` reports process, scheduler, execution, and governance separately. The aggregate result is deliberately `propose_only` with `canMutate: false` until a production verifier and durable approval-token store exist.

## Override and incident procedure

1. Stop agent proposals and preserve the current audit log.
2. Identify the affected entity, actor, correlation ID, and mutation endpoint.
3. Do not restore mutation authority until the verifier and downstream execution target are both freshly healthy.
4. Record the operator, reason, start time, expiry, and recovery evidence for any future override.

## Negative tests required before production

- Missing, invalid, expired, replayed, or wrong-entity approval token.
- Stale governance health while process health remains green.
- Duplicate mutation request with the same idempotency key.
- Cross-entity record access and assistant instruction injection from uploaded content.
- Audit sink failure and downstream ERP or bank timeout.
