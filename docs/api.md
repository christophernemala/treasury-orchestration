# API contract

The existing `/api` treasury endpoints remain compatible. New ERP/CRM contracts are additive under `/api/v1` and require a bearer token.

## Platform reads

- `GET /api/v1/modules`
- `GET /api/v1/legal-entities`
- `GET /api/v1/customers[/:id]`
- `GET /api/v1/invoices[/:id]`
- `GET /api/v1/bank-accounts`
- `GET /api/v1/payments[/:id]`
- `GET /api/v1/payments/:id/tracking`
- `GET /api/v1/escrow/accounts`
- `GET /api/v1/approvals`
- `GET /api/v1/audit-events`

## Controlled writes

- `POST /api/v1/customers`
- `POST /api/v1/invoices`
- `POST /api/v1/invoices/:id/issue`
- `POST /api/v1/invoices/:id/close`
- `POST /api/v1/escrow/releases` (approval request only; no external execution)
- `POST /api/v1/approvals/:id/decisions`
- `POST /api/v1/dev/reset` (admin development utility)

All v1 POST routes require `Idempotency-Key`. Responses include `X-Correlation-ID`. Errors use:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Your role does not grant this operation.",
    "correlationId": "uuid"
  }
}
```

`GET /api/health` is unauthenticated. The SSE feed remains at `GET /api/treasury/live-stream` and uses bearer authentication through `fetch-event-source`.
