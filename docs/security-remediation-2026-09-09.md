# Authentication, authorization, configuration and SSE remediation

## Target and provenance

- Confirmed target: `christophernemala/treasury-orchestration`.
- Fetched baseline: `origin/main` at `8665b4b060e2a4adc4df8f2c9725a831e189c86f`, including the merged Treasury Atom UAT evidence pack.
- Fix branch: `fix/auth-tenant-sse-remediation-20260909`.
- Isolated worktree: `C:\Users\nemal\motion-graphic-web-generator\server\treasury-remediation`.
- Original checkout: `C:\Users\nemal\Documents\Codex\2026-08-29\referenced-chatgpt-conversation-this-is-an\outputs\agentic-treasury`, originally at `9ce37298a70c22f7e24e111975304b48810d0d3e`.
- Original untracked `client/src/components/TreasuryAssistantScene.tsx` SHA-256: `8C87CF1A89DEAA7E3766D40D0AB6B9275E97A1CFAC16FB0A9367FC151589D090`.

The earlier unidentified **47-file build remains unlocated and its relationship to this repository is unverified**. The owner confirmed this target and explicitly removed that build as a prerequisite. This remediation makes no claim to reproduce or incorporate it. It was performed locally without deployment, push, or remote database changes.

Applicable instructions were the owner's supplied AGENTS.md rules and `C:\Users\nemal\AGENTS.md`; the fetched repository contained no AGENTS.md files. Existing React/Vite/Express architecture and dependencies were preserved.

## Evidence reviewed and reproduced

Reviewed the latest source, `docs/phase-1-production-blueprint.md` (historical findings TA-001, TA-002, TA-003, TA-005, TA-009, TA-010 and TA-013), verification/deployment runbooks, existing tests, and the UAT README, runner, fixtures and defect register.

Before changing application code, seven new regressions failed against the fetched source: production fallback OTP acceptance, missing signing configuration, unlisted-origin signup, automatic access after self-signup, deleted-user token reuse, cross-entity invoice/customer linkage, and cross-entity idempotency replay. These same seven tests pass after remediation.

## Resulting behavior

- Only explicit `development` or `test` environments enable the prototype. `npm run dev` supplies the development environment through its local entrypoint. `npm start`, unset environments and unknown environment names fail closed.
- `AUTH_SECRET` is the single signing variable. Missing, short, whitespace, low-variety and obvious placeholder values are rejected outside development; supplied invalid values are rejected in development too. The old `JWT_SECRET` variable is rejected. Development without a configured secret uses a process-local key. Production must use a high-entropy secret-manager value; validation cannot prove entropy.
- `CLIENT_ORIGIN` is a comma-separated list of exact origins. Production configuration requires HTTPS and rejects paths, credentials, wildcards and localhost. Unlisted browser origins, including preflight requests, are rejected before route side effects. Requests without an Origin header still require normal API authentication and authorization.
- Production identity and persistence adapters do not exist. With otherwise valid configuration, liveness is `200`, readiness and application APIs/SSE are `503`, and development signup/reset paths are `404`. Development routes are not registered in the production app, and production memory repositories initialize empty. Supplying Supabase environment values does not activate an adapter.
- Development OTPs are random per challenge, expire after five minutes, allow at most five guesses, and are consumed once. Fixed OTP overrides are unused, and `DEV_OTP` is rejected outside development. Returning a development code to the local form is a demo flow, not production MFA.
- JWTs expire after 15 minutes and require the intended algorithm, issuer, audience, subject and expiry. Only subject and selected tenant identify the session; token role/permission/entity claims grant no authority. Deleted or disabled users are rejected.
- Every request resolves current active membership, its role and assigned legal entities. Entity grants must belong to that tenant and be active. Development seed memberships are explicit fixtures. Self-signup creates no membership or data permissions. A local account with multiple tenant memberships currently selects its first active membership at login; production tenant selection remains part of the future identity adapter.
- V1 collections and detail routes enforce the effective entity scope. Invoice customers and invoice-close approvals must belong to the same legal entity. Customer/invoice idempotency keys include tenant, entity, user, method and route, validate payload reuse, and check current access before replay.
- Legacy records and snapshots lack per-record tenant/entity ownership. They are confined to the Northstar demo workspace and require access to **both** demo entities. Partial-scope and foreign-tenant members receive `403` on legacy lists, details, writes, exports, audit and SSE. This is a deliberate denial boundary; it is not a production repository or a filtered stream implementation. Use scoped v1 routes for individual-entity access.
- SSE checks membership, full legacy scope and bank/ledger read permissions before opening. It revalidates identity, membership and permissions before every snapshot/heartbeat, closes at token expiry, and cleans up timers/clients on disconnect, errors and backpressure. No financial event is written after failed revalidation. Idle revocation is detected on the next heartbeat, within 15 seconds; broadcasts recheck immediately.
- Legacy seed resets preserve users and memberships. Platform reset requires full demo admin scope and refuses a repository containing another tenant. Self-signup and foreign-scope onboarding are not written into the shared demo treasury audit.
- REST, CSV and SSE clients share `VITE_API_BASE_URL`. Production client builds do not prefill demo credentials or advertise a fixed OTP.

## Local validation

Validation uses the existing lockfile and dependencies, Node.js `v26.8.1`, and Windows `npm.cmd`. No new dependency was added.

| Check | Result |
| --- | --- |
| Seven initial API security regressions before fixes | 7 failed, confirming the source defects |
| `npm.cmd run check` after fixes | Server and client strict TypeScript/build checks passed; 51 tests passed across 6 files |
| Existing API, platform and reconciliation suites | All 11 existing tests passed |
| New security, configuration, entity and SSE suites | 40 regression tests passed, including actual loopback HTTP stream revocation/expiry |
| Existing offline UAT runner | 18/18 scenarios and 9/9 control totals passed |
| `npm.cmd audit --omit=dev --audit-level=high` | 0 reported vulnerabilities |
| Compiled production entrypoint and existing health script | 9 endpoint checks passed; existing health script passed; production and unset environments rejected missing signing configuration |

The UAT runner recomputes its existing evidence outputs without semantic changes. Its authorization and refresh cases use fixture assertions; they do not prove runtime security or browser refresh behavior. The new API tests separately exercise TAT-UAT-016 unauthorized close/approval and TAT-UAT-017 unauthorized payment/escrow paths and verify no state change. There is no configured lint script. No browser end-to-end run, remote RLS validation, deployment test, or production database test is claimed.

## Remaining production blockers

Production financial use remains **NO-GO**. This bounded patch closes demonstrated access paths and disables the unconfigured production runtime; it does not deliver the planned production platform.

1. Implement and validate real workforce identity/MFA, invitation and tenant selection, durable memberships, deprovisioning and signing-key rotation. Add production abuse/rate limits and session lifecycle controls.
2. Implement durable, tenant/entity-aware repository adapters and validate operation-specific RLS, role separation and cross-tenant foreign keys against an isolated database. Existing migrations were neither applied nor remotely verified in this work.
3. Replace legacy aggregate data and SSE with record ownership, scoped snapshots and a durable event outbox. Add cross-process revocation and event recovery tests.
4. Replace legacy binary floating-point financial amounts with exact decimal contracts and durable ledger constraints. Complete transaction-bound idempotency, approvals, immutable audit and evidence storage; in-memory caches and challenges are not production durability.
5. Complete approved hosting, TLS/proxy/SSE behavior, monitoring, backups/restore, security scanning, external connector validation and Treasury/Finance/Security sign-off from the production blueprint. No external posting or payment execution is enabled.
