# Treasury Atom architecture

Treasury Atom is a modular monolith: React 19 + TypeScript at the UI edge, Express 5 at the API boundary, and repository interfaces between domain modules and persistence. React Router owns stable post-login module URLs, TanStack Query owns server-state caching, and authenticated SSE refreshes treasury snapshots.

```text
Browser
  ├─ authentication + REST lifecycle (App.tsx)
  ├─ authenticated workspace shell (ObsidianDashboard)
  ├─ live state visualizer
  │    ├─ MotionRound (presentational, state-linked)
  │    ├─ MotionControls (operator inputs)
  │    └─ useMotionSettings (validation + localStorage)
  ├─ treasury modules (/app/*)
  └─ authenticated SSE (/api/treasury/live-stream)
          │
Express API
  ├─ treasury operations (/api/*)
  ├─ versioned platform API (/api/v1/*)
  ├─ correlation + error envelope
  ├─ entity policy + maker-checker gates
  └─ repository contracts
          │
  ├─ in-memory development repository (current runtime)
  └─ Supabase/Postgres adapter (next runtime boundary)
          ├─ organization-scoped RLS
          ├─ close, statement, transaction and evidence tables
          ├─ approvals + append-only audit receipts
          └─ no seeded financial records
```

## Motion state flow

`MotionRound` never performs a financial mutation. Reconciliation rate, exception count and connection state come from the same SSE snapshot used by the KPI cards. Operator changes are clamped by `useMotionSettings`, rendered immediately by Framer Motion, and persisted locally under `treasury-atom:motion:v1`. Reduced-motion preferences make the visual stable while preserving all controls and data.

## Finance boundaries

Money in the v1 domain is transported as fixed-precision decimal strings. All durable records are legal-entity scoped. Controlled mutations require explicit permission and an `Idempotency-Key`. The Supabase migration enables RLS on every exposed treasury table and inserts no illustrative balances. The current runtime remains in-memory until Supabase Auth and the repository adapter are configured; the UI therefore continues to label those values illustrative.

