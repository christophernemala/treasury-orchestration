# Deployment and hardening guide

## Local

Run `npm run dev`. Vite serves the UI on `http://127.0.0.1:5173` and proxies `/api` to Express on `http://127.0.0.1:4320`. Use `GET /api/health/runtime` for readiness and `npm run check` for the full build/test gate.

**2026-09-09 remediation:** `/api/health` is liveness only. Production requires a non-placeholder `AUTH_SECRET` of at least 32 characters and exact HTTPS origins in `CLIENT_ORIGIN`; `JWT_SECRET` and production `DEV_OTP` are rejected. Configuration alone does not enable production: `/api/health/runtime`, authentication, data APIs and SSE return `503` until real identity and persistence adapters exist. Development signup/reset routes are not registered in production, and production stores start empty. See [the remediation evidence](security-remediation-2026-09-09.md).

## Supabase

The migrations in `supabase/migrations` define the empty production treasury schema, organization membership, RLS policies, evidence metadata, approval gates and audit receipts. An earlier deployment note reported that migrations were applied and the security advisor had no findings; that remote state was not verified during this local remediation. No remote database was modified. To activate persistence as the application source of truth:

1. Configure Supabase Auth and provision organization memberships through a trusted admin workflow.
2. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and the server-only `SUPABASE_SECRET_KEY` through a secrets manager.
3. Implement the existing repository interfaces against Postgres, then run contract tests against both repositories.
4. Store uploaded statement evidence in a private bucket with organization-scoped storage policies.
5. Switch the SSE snapshot builder to the Postgres repository and durable event outbox.

Do not place the secret key in `VITE_*` variables or frontend code.

## Vercel boundary

The static Vite client is Vercel-compatible, but deploying it alone would break the API and authenticated SSE. The current long-running Express stream should be hosted on a service that supports persistent connections, or replaced with Supabase Realtime/private channels before a single-platform Vercel deployment. Do not deploy a visually working frontend with non-working treasury controls.

Before a non-local launch, also restrict CORS, add rate limits and CSRF controls, rotate secrets, configure backups, run tenant-isolation tests, add observability, and obtain finance-control and penetration-test sign-off.

