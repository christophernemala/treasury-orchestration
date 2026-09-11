# REFERENCE.md — Treasury Atom Technical Reference

> Complete API contract, database schema, security invariants, mathematical models, and real-time SSE specifications for Treasury Atom.

---

## 1. System Architecture & Topology

Treasury Atom is an enterprise treasury and cash orchestration system built with a high-assurance, zero-float mathematical model and strict separation of duties.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (React 19 / Vite)                  │
│   • Cash Visibility Dashboard        • Bank Statement Ingestion UI     │
│   • Reconciliation Workspace         • Maker-Checker Approval Modal    │
│   • Real-Time SSE Consumer           • Multi-Entity Switcher           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST + EventSource (SSE)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    API Gateway & Security Boundary                     │
│   • Origin Validation (Strict CORS)  • JWT Auth (15-min lifetime)      │
│   • Legal Entity Scope Filter        • Rate Limiting & Audit Logger    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express Domain Services                           │
│   • CashPositionService              • ReconciliationEngine            │
│   • MakerCheckerService              • LiquidityForecastService        │
│   • AgentEngine (Explainability)     • SSE Hub (Heartbeat + Broadcast) │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ SQLite Repository (node:sqlite)  │ │ Supabase Postgres (Production)   │
│ • Local persistence              │ │ • Versioned Migrations           │
│ • Transactional ACID guarantees  │ │ • Row-Level Security (RLS)       │
│ • Path: .runtime/treasury.db     │ │ • Org & Entity Isolation Policies│
└──────────────────────────────────┘ └──────────────────────────────────┘
```

---

## 2. Mathematical Invariants & Precision Rules

### 2.1 Zero-Float Decimal Precision
- **IEEE 754 Floating Point Math is strictly prohibited** for currency balances, transactions, and ledgers.
- All monetary arithmetic uses `Decimal.js` or fixed 2-decimal string math (`12345.67`).
- Base Currency: `AED` (United Arab Emirates Dirham), with multi-currency FX conversions computed against ECB/CBUAE daily fixings.

### 2.2 Cash Position Formulas
```math
Total Bank Balance = ∑(Active Bank Account Balances)
Restricted Cash = Escrow Balances + Collateral Liens + Regulatory Holds
Available Operating Liquidity = Total Bank Balance - Restricted Cash - Unsettled Reservations
Net Working Cash = Available Operating Liquidity + Undrawn Committed Facilities - Immediate Payables (T+3)
```

---

## 3. REST API Contract

All endpoints require `Authorization: Bearer <token>` unless specified as public.

### 3.1 Health & Governance
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Liveness check (process up, memory, uptime) |
| `GET` | `/api/health/runtime` | Public | Layered readiness check (scheduler, database, governance) |

### 3.2 Authentication & Tenant Scoping
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Initial login; generates 6-digit dev OTP |
| `POST` | `/api/v1/auth/verify-otp` | Public | Validates OTP; issues 15-minute JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns user profile, tenant ID, and assigned legal entities |

### 3.3 Treasury Operations
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/treasury/positions` | Authenticated | Consolidated cash positions across authorized legal entities |
| `GET` | `/api/v1/treasury/accounts` | Authenticated | List bank accounts filtered by entity scope |
| `POST` | `/api/v1/treasury/statements/ingest` | Authenticated (Maker) | Ingest MT940 / CAMT.053 / Excel bank statements |
| `GET` | `/api/v1/treasury/transactions` | Authenticated | Bank transactions with matching status and confidence scores |
| `POST` | `/api/v1/treasury/reconcile/propose` | Authenticated | Run heuristic matching engine between statements and GL |
| `POST` | `/api/v1/treasury/reconcile/approve` | Authenticated (Checker) | Maker-checker dual control reconciliation approval |

### 3.4 Real-Time Server-Sent Events (SSE)
| Method | Endpoint | Protocol | Purpose |
|---|---|---|---|
| `GET` | `/api/treasury/live-stream` | `text/event-stream` | Authenticated SSE stream for live balances, alerts, and approvals |

**Stream Event Types**:
- `connected`: Handshake with client, confirms entity subscriptions.
- `balance_update`: Real-time notification of bank credit/debit settlement.
- `reconciliation_proposed`: Agent or system proposed a transaction match.
- `approval_requested`: High-value payment or journal requiring Checker authorization.
- `approval_completed`: Dual-control action verified and closed.
- `heartbeat`: Keep-alive packet emitted every 15 seconds.

---

## 4. Security & Governance Invariants

### 4.1 Separation of Duties (Maker-Checker)
1. **Rule**: The user who initiates or drafts a transaction (`makerId`) cannot approve, execute, or reconcile it.
2. **Enforcement**:
   ```typescript
   if (action.makerId === currentUser.id) {
     throw new ForbiddenError("DUAL_CONTROL_VIOLATION: Maker cannot approve own request");
   }
   ```
3. **Thresholds**:
   - Any transaction > 100,000 AED requires Level 2 Checker approval.
   - Any transaction > 500,000 AED requires Dual Checker approval (2 independent signatories).

### 4.2 Legal Entity & Tenant Scoping
- Users belong to a Tenant (`tenantId`) and are assigned specific Legal Entities (`legalEntityIds: string[]`).
- Cross-entity reads or foreign entity modifications return `403 ENTITY_SCOPE_DENIED`.
- Data stores enforce scoping at the SQL query level (`WHERE tenant_id = ? AND legal_entity_id IN (...)`).

### 4.3 Fail-Closed Production Stance
- If `NODE_ENV === "production"`, missing database connections, unconfigured secrets (`AUTH_SECRET`), or non-whitelisted origins fail closed immediately.
- Mock/seed endpoints (`/api/seed`, `/api/v1/dev/reset`) are completely unmapped in production.

---

## 5. Database Schema & Models

### Core Tables (SQLite & PostgreSQL)

```sql
-- Legal Entities
CREATE TABLE legal_entities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    code TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    country TEXT NOT NULL,
    base_currency TEXT DEFAULT 'AED',
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts
CREATE TABLE bank_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    entity_id TEXT NOT NULL REFERENCES legal_entities(id),
    bank_name TEXT NOT NULL,
    masked_account TEXT NOT NULL,
    currency TEXT NOT NULL,
    account_type TEXT NOT NULL, -- operating, escrow, payroll, tax
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    restricted_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL
);

-- Transactions & Statements
CREATE TABLE bank_transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES bank_accounts(id),
    statement_id TEXT NOT NULL,
    booking_date DATE NOT NULL,
    value_date DATE NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency TEXT NOT NULL,
    counterparty_name TEXT,
    reference TEXT,
    match_status TEXT DEFAULT 'unmatched', -- unmatched, proposed, matched, disputed
    matched_journal_id TEXT,
    maker_id TEXT,
    checker_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Immutable Audit Trail
CREATE TABLE treasury_audit_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata JSON,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
