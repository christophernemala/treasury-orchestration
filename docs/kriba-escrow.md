# KRIBA Escrow integration boundary

KRIBA Escrow is represented by a provider-neutral boundary until an authoritative vendor API, sandbox, authentication scheme and webhook contract are supplied. The current implementation is illustrative and performs no external balance query, transfer or release.

## Current behavior

- `GET /api/v1/escrow/accounts` returns entity-scoped illustrative accounts.
- `POST /api/v1/escrow/releases` validates a fixed-precision amount and requires `escrow.release` plus an `Idempotency-Key`.
- A release request creates a maker-checker approval and audit receipt.
- The response explicitly reports `externalAction: "not_executed"` and `providerStatus: "pending_vendor_validation"`.
- No provider credentials, URLs or fabricated production events are included.

## Required vendor inputs

Before enabling a live adapter, obtain the exact official KRIBA URL, OpenAPI/API documentation, sandbox credentials, authentication and webhook-signature specifications, status vocabulary, idempotency behavior, rate limits, data residency, retention terms, reconciliation identifiers and error catalogue.

## Required live adapter contract

The adapter must support account lookup, transaction-status lookup, release requests, idempotency keys and signature-verified webhook normalization. All external effects remain behind entity scope, module permission, maker-checker approval and immutable audit evidence. Provider failures must never be interpreted as successful releases.

Do not silently substitute Kriya or Kyriba for KRIBA. If the intended vendor is actually Kyriba, confirm that explicitly and implement against its contracted developer documentation.
