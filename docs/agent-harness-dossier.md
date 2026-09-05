# Treasury Atom agent harness dossier

## 1. Outcome and boundary

- **User outcome:** explain treasury close state from reviewed workspace records and route a human to the next evidence-backed decision.
- **Durable mutations:** local transaction CRUD, reconciliation decisions, approval decisions, and audit receipts.
- **Explicit non-goals:** autonomous payments, direct ERP posting, invented bank connectivity, or browser-held provider secrets.
- **Deployment shape:** `machine` structural candidate.
- **Why:** the current assistant is deterministic and selects no model-driven transitions. Runtime conformance remains `UNSCORED`.

## 2. Trust roles

| Role | Current identity | Authority | Must differ from |
| --- | --- | --- | --- |
| Contract proposer | Product configuration | Define supported local workflow | Ratifier |
| Contract ratifier | Deferred production control owner | Approve immutable acceptance tests | Proposer |
| Worker | Deterministic explanation function | Read and propose only | Result verifier |
| Result verifier | Human treasury reviewer plus API validation | Validate evidence and decision | Worker |
| Operator | Authenticated admin | Halt/reset development runtime | — |

The production ratifier, independent verifier service, signer, and append-only external receipt principal remain deferred and must not be implied by the UI.

## 3. State machine

- **Durable states:** `not_started → needs_review → evidence_uploaded → ready_for_approval → approved`; exception paths end in `rejected` or `quarantined`.
- **Allowed transitions:** only schema-listed adjacent transitions after identity, entity scope, evidence, and approval checks.
- **Terminal states:** `approved`, `rejected`, `quarantined`.
- **Persist-before-effect:** write intent and idempotency identity, verify evidence, persist gate decision, perform the local effect, then append its receipt.
- **Kill/resume:** reload from durable intent; never infer completion from a lost session. The current in-memory store does not yet satisfy this production obligation.

## 4. Ports and adapters

| Port | Contract | Current implementation | Failure behavior |
| --- | --- | --- | --- |
| Queue | Bounded work intent | Not configured | Propose only |
| Worker | Read-scoped explanation | Deterministic client function | No mutation |
| Verifier | Evidence/result check | Human review plus schemas | Deny on missing evidence |
| State store | Versioned treasury state | In-memory development store | Reset/restart loses state |
| Governance gate | Single mutation authorization | Auth and route checks; production gate deferred | `canMutate: false` in runtime health |
| Receipt sink | Append-only event contract | Local audit collection | Do not claim immutability |
| Alert channel | Acknowledged escalation | Not configured | Operator-visible blocked status |
| Ground-truth view | Entity-scoped source records | REST dashboard, transactions, statements | Mark unknown or unavailable |

## 5. Governance

- Operator dial is `0` for agent mutations.
- Effective agent authority is read and propose only.
- Missing or stale verifier state defaults to denial.
- Reversibility is false unless an independently resolvable rollback reference exists.
- Payment, ERP, and bank effects require a final expiring human gate after evidence review.
- Current mutation inventory is recorded in `automation/governance-policy.yaml`.

## 6. Operational controls

- Production idempotency identity: hash of organization, entity, action, subject, normalized payload, and intent version with a unique active-effect constraint.
- Attempts, elapsed time, provider calls, tokens, and spend require per-contract ceilings before a model worker is introduced.
- Exhausted verification or retry budgets transition to terminal quarantine.
- Alerts require acknowledgement, followed by throttle and halt when the deadline expires.
- Four-layer readiness is exposed at `GET /api/health/runtime`; incomplete governance keeps the aggregate at `propose_only`.
- Required anomalies include duplicate effects, cross-entity access, stale authority, provider failure, receipt failure, and instruction injection.

## 7. Evidence plan

- Acceptance: authentication precedes workspace access; assistant statements derive from current state; every connector is labeled accurately; reduced motion and keyboard access remain usable.
- Chaos/replay: kill between intent and effect, replay identical idempotency keys, expire verifier health, and fail the receipt sink.
- Gate traces: record allow/deny reason, actor, entity, contract hash, verifier freshness, and correlation ID.
- Negative tests: bypass routes, wrong-entity tokens, stale approvals, duplicate effects, and injected document instructions.
- Conformance claim: `UNSCORED` until runtime evidence exists.

## First thin vertical slice

The implemented slice is read → deterministic explanation → human navigation to reconciliation → authenticated local decision → audit event. It deliberately excludes autonomous mutation and external connectors.

## Deferred controls

Durable PostgreSQL state, independent contract ratification, verifier service, signed append-only receipt sink, queue isolation, expiring capability tokens, alert acknowledgement, and chaos evidence remain production prerequisites.
