# Treasury Atom

Treasury Atom is a governed treasury month-end workspace for cash visibility, bank-statement ingestion, transaction review, reconciliation, evidence, approvals and auditable agent workflows. It includes an authenticated real-time SSE dashboard and interactive motion controls while clearly identifying seeded development data as illustrative.

The application contains working local transaction CRUD, reconciliation decisions, unapplied-cash workflows, CSV export, authenticated SSE updates and audit records. External treasury integrations are not represented as live. See the [treasury operations coverage matrix](docs/treasury-operations-coverage.md) for the exact boundary and production completion sequence.

## Technology

- React 19, TypeScript, Vite and React Router
- Framer Motion, TanStack Query and Lucide
- Node.js and Express 5 REST API
- Authenticated Server-Sent Events at `/api/treasury/live-stream`
- Vitest API and reconciliation tests
- Supabase/PostgreSQL migrations with organization-scoped row-level security
- Vercel-compatible frontend; persistent API hosting or Supabase Realtime migration required for the SSE backend

> The current implementation is React/Vite plus Express/TypeScript. It is not currently a Next.js or FastAPI application.

## Repository structure

```text
client/       React application and visual treasury workspace
server/       Express API, domain services, policies and tests
supabase/     Versioned PostgreSQL migrations
docs/         Architecture, API, deployment and UI audit documentation
scripts/      Local developer utilities
automation/   Reserved for reviewed n8n workflows and agent configurations
```

The original Treasury Atom humanoid login artwork is stored at `client/public/assets/treasury-atom-assistant.png`; it contains no third-party branding or embedded interface text.

## Run locally

Prerequisites: Node.js 22 or later and npm.

```powershell
git clone https://github.com/christophernemala/treasury-orchestration.git
cd treasury-orchestration
Copy-Item .env.example .env
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/app`. Vite proxies `/api` to the Express server at `http://127.0.0.1:4320`, so `VITE_API_BASE_URL` is unnecessary locally.

Local development access uses `admin@treasury.local` / `Treasury123!` with OTP `246810`. It is intentionally local authentication and must be replaced by production identity before deployment.

## Health, reset and quality gates

```powershell
Invoke-WebRequest http://127.0.0.1:4320/api/health
./scripts/check-health.ps1
npm run check
```

- `GET /api/health` checks backend readiness.
- `GET /api/health/runtime` reports process, scheduler, execution and governance readiness; development remains deliberately `propose_only`. See [docs/governance.md](docs/governance.md).
- `POST /api/v1/dev/reset` restores the platform repository to its illustrative seed state; an admin token is required.
- `POST /api/seed` restores legacy treasury transaction/reconciliation seeds; an admin token is required.
- `npm run check` builds both workspaces and runs all server tests.

## Environment variables

Copy `.env.example` and supply values through your local secret store or hosting provider. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | Express API port; defaults to `4320`. |
| `CLIENT_ORIGIN` | Allowed browser origin for local CORS. |
| `AUTH_SECRET` | Long random server-side signing secret. |
| `SUPABASE_URL` | Supabase project API URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key. |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret; never use a `VITE_` prefix. |
| `VITE_API_BASE_URL` | Optional URL when the API is hosted separately from the frontend. |
| `CUSTOMER_IO_APP_API_KEY` | Future server-only Customer.io App API credential. |
| `CUSTOMER_IO_TRACK_SITE_ID` | Future server-side Customer.io tracking site identifier. |
| `CUSTOMER_IO_TRACK_API_KEY` | Future server-only Customer.io Track API credential. |

## Supabase

The migrations create an empty, RLS-protected treasury schema for organizations, memberships, bank accounts, statements, transactions, reconciliations, close periods/tasks, evidence, approvals, audit receipts and motion preferences. No bank credentials or fabricated balances are inserted.

The running Express application still uses its in-memory repository until Supabase Auth and the Postgres repository adapter are enabled. See [the deployment guide](docs/deployment.md) for the controlled migration sequence.

## Deployment

### Frontend on Vercel

Configure the project root as `client`, build command `npm run build`, and output directory `dist`. Set `VITE_API_BASE_URL` to the separately hosted HTTPS API.

### API and SSE

Deploy `server/dist/index.js` to a Node.js host that supports persistent HTTP connections. Configure TLS, `CLIENT_ORIGIN`, `AUTH_SECRET`, Supabase server variables, health checks and a process supervisor. Deploying only the frontend would leave authentication, transactions and SSE unavailable.

For a single Vercel/Supabase architecture, migrate authenticated events to private Supabase Realtime channels before removing the Express SSE process.

## Current status

- Functional local authentication, REST workflows and authenticated SSE updates
- Evidence-bound Intelligence workspace with deterministic investigation prompts and propose-only controls
- Operational real-time motion controls persisted per browser
- Responsive UI with reduced-motion and keyboard support
- Customer workspace with interactive, truth-labelled ERP/GL, banking, evidence and communications connection points
- Working workspace shortcuts: `K` focuses record search, `D` toggles the data map, `R` refreshes, and `Esc` clears search
- Empty Supabase treasury schema applied with RLS; security advisor clean
- Production build and 11 automated server tests passing

### Known issues

- Runtime treasury records are still illustrative and in memory.
- Development password/OTP authentication is not production identity.
- There is no validated live bank, ERP/GL, email or payment connection.
- The CRM connection map reports integration readiness only; it does not initiate external reads or mutations.
- The communication agent creates local previews only; Customer.io delivery is not connected.
- Evidence file binaries still require a private object-storage adapter.
- Vercel alone cannot host the current persistent Express SSE process.

## Related assets

- Figma: _Not yet published_
- Product requirements / Google Drive: _Not yet published_
- Power BI semantic model: _Not yet created_
- Operational runbook: [docs/deployment.md](docs/deployment.md)

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Deployment and hardening](docs/deployment.md)
- [UI and product audit](docs/ui-audit.md)
- [KRIBA Escrow integration boundary](docs/kriba-escrow.md)
- [Treasury Atom redesign brief](docs/treasury-atom-redesign-prompt.md)
