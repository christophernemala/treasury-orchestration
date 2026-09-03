# Deployment and hardening guide

## Local

Run `npm run dev`. Vite serves the UI on `http://127.0.0.1:5173` and proxies `/api` to Express on `http://127.0.0.1:4320`. Use `GET /api/health` for readiness and `npm run check` for the full build/test gate.

## Supabase

The migrations in `supabase/migrations` create the empty production treasury schema, organization membership, RLS policies, evidence metadata, approval gates and audit receipts. They are already applied to the configured project, with the security advisor returning no findings. To activate it as the application source of truth:

1. Configure Supabase Auth and provision organization memberships through a trusted admin workflow.
2. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and the server-only `SUPABASE_SECRET_KEY` through a secrets manager.
3. Implement the existing repository interfaces against Postgres, then run contract tests against both repositories.
4. Store uploaded statement evidence in a private bucket with organization-scoped storage policies.
5. Switch the SSE snapshot builder to the Postgres repository and durable event outbox.

Do not place the secret key in `VITE_*` variables or frontend code.

## Vercel boundary

The static Vite client is Vercel-compatible, but deploying it alone would break the API and authenticated SSE. The current long-running Express stream should be hosted on a service that supports persistent connections, or replaced with Supabase Realtime/private channels before a single-platform Vercel deployment. Do not deploy a visually working frontend with non-working treasury controls.

Before a non-local launch, also restrict CORS, add rate limits and CSRF controls, rotate secrets, configure backups, run tenant-isolation tests, add observability, and obtain finance-control and penetration-test sign-off.

