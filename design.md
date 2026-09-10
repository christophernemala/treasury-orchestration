# Treasury Atom — Design System & Architecture Specification

## 1. Executive Summary & Design Direction
Treasury Atom is a high-assurance financial command center engineered for corporate treasurers, finance controllers, and cash managers. It pairs calm architectural visual discipline with mathematical rigor.

- **Brand Aesthetic**: Dimensional identity, clear financial information. Warm, restrained, and authoritative.
- **Color Palette**:
  - **Graphite (`#151B1E`)**: Primary dark anchor, deep sidebar background, elevated dark cards.
  - **Mineral (`#F3F4F0`)**: Warm off-white mineral background for workspace readability and contrast.
  - **Petrol (`#315B58`)**: Deep teal-cyan primary call-to-action, active accents, focus states.
  - **Champagne (`#C3A77B`)**: Muted metallic gold for luxury signifiers, verified indicators, subtle borders.
  - **Signal Mint (`#2E7D68` / `#72E6BF`)**: Healthy reconciled balance, matched transactions.
  - **Signal Amber (`#D97706` / `#F2B563`)**: Pending review, suggested match, approaching threshold.
  - **Alert Coral (`#DC2626` / `#EF7B72`)**: Exceptions, overdue items, rejected approvals, security blocks.
- **Typography Stack**:
  - **Headings & Branding**: `Space Grotesk`, sans-serif (weights 500, 600, 700).
  - **Body & UI**: `Manrope` with fallback to `Inter`, system-ui, sans-serif (weights 400, 500, 600).
  - **Monospace & Financial Codes**: `JetBrains Mono` for account numbers, transaction hashes, IBANs, and audit IDs. Tabular numbers (`font-variant-numeric: tabular-nums`) applied across all currency figures.

---

## 2. Information Architecture & Navigation

The navigation is structured into logical groups to prevent visual clutter and maintain immediate access to daily operational workflows:

```
[ Treasury Atom Logo ]
[ 🏛 Treasury Workspace Selector ]
────────────────────────────────
WORKSPACE
  🏠 Overview               (Cash summary, quick import, KPI calculation, recent flow)
  📊 Cash & Liquidity       (Entity balances, restricted cash, facility headroom)
  📑 Reconciliation         (Statement import, transaction matching workspace, exceptions)
  ✓ Approvals              (Maker-checker inbox for payments, invoices, escrow releases)

OPERATIONS
  💳 Collections & Settle   (Merchant gateways, gross collections, fees, bank matching)
  📤 Outbound Payments      (Payment requests, beneficiary controls, Kyriba gateway)
  🔒 Escrow Monitoring      (Project escrow accounts, legal restrictions, disbursement prep)

INTELLIGENCE
  📈 Reports                (Cash position, reconciliation exceptions, audit CSV exports)
  ⚡ Agent Activity          (Verifiable deterministic agent runs, proposals, audit logs)

SYSTEM
  🔗 Connections            (Connector health: Kyriba, Stripe Test Mode, Bank feeds)
  ⚙ Settings               (Entities, user permissions, audit policies)
```

### Primary User Journeys
1. **Morning Cash Verification & Consolidation**:
   - Treasurer logs in through authenticated single-use OTP flow.
   - Inspects Overview KPIs: Available Cash (`Bank cash - Restricted cash`), Unreconciled Value, Pending Approvals.
   - Reviews "How this is calculated" card to confirm evidence timestamps and restriction deductions.
2. **Statement Ingestion & Reconciliation**:
   - User clicks `[Import statement]`, uploads bank CSV/MT940/CAMT.053 file.
   - Bank transactions are ingested into durable tenant storage with exact decimal validation.
   - Automated matching engine proposes candidate journal matches with confidence scores.
   - Controller reviews and confirms or marks exceptions.
3. **Dual-Control Payment & Escrow Release**:
   - Maker creates outbound payment or escrow release request with supporting documentation.
   - Request enters Approvals inbox with cryptographic payload binding.
   - Checker reviews; system enforces separation of duties (maker cannot self-approve).
   - Approval recorded in tamper-evident audit trail; payment status moves to verified queue.

---

## 3. Financial Metrics & Calculation Conventions

| Metric | Formula | Definition & Constraints |
|---|---|---|
| **Bank Cash** | `Σ(Bank Statement Closing Balances)` | Cleared funds reported directly by bank feeds or validated statement imports. |
| **Restricted Cash** | `Σ(Escrow Balances + Legal Holds + Collateral Liens)` | Cash subject to third-party restrictions or regulatory escrow; not usable for operating expenses. |
| **Reservations** | `Σ(Approved Outbound Payments Awaiting Settlement)` | Funds committed to specific disbursements not yet debited from the bank statement balance. |
| **Available Cash** | `Bank Cash - Restricted Cash - (Reservations not yet debited)` | Net unencumbered liquidity immediately available for operational deployment. |
| **Unreconciled Value**| `Σ(Abs(Amount)) for status in ('unmatched', 'exception')` | Total absolute volume of statement lines without verified general ledger pairing. |
| **Pending Approvals** | `Count of Pending Decisions` | Count of maker-checker governance requests awaiting secondary review. |

### Arithmetic Invariants
- **No Floating Point Arithmetic**: All monetary calculations execute with exact 2-decimal string arithmetic or fixed-point representations (`Decimal.js` equivalent).
- **Explicit Currency Codes**: Every balance, transaction, and report line item must declare its ISO 4217 currency code (default: `AED`).
- **No Double Counting**: Restricted balances must never appear as unencumbered liquidity; reservations already debited by the bank are excluded from deduction.

---

## 4. Layouts, Component States & Motion System

### Component States
- **Inputs & Buttons**: Default, Hover, Focus-Visible (2px solid `#315B58` with 2px offset), Disabled, Loading (subtle spinner), Error (inline message with aria-describedby).
- **Data Tables**:
  - Loading: Skeleton shimmer matching table row heights.
  - Empty: Semantic illustration + contextual call-to-action (e.g. "Imported statements will appear here" with `[Import a file]` button).
  - Filtered No-Match: "No records match the selected filters" with `[Clear filters]` reset.
  - Error: Inline retry banner with correlation identifier.
- **Connection Badges**:
  - `Unconfigured`: Gray outline badge.
  - `Test Mode`: Amber badge (`#D97706`).
  - `Connected`: Petrol / Signal Mint badge (`#315B58`).
  - `Error`: Coral alert badge (`#DC2626`).

### Motion Principles & Reduced Motion
- Micro-transitions: `150ms–250ms` cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Tab and page transitions: Subtle 8px vertical fade.
- 3D Login Scene: Restrained ambient orbital rotation of glowing metallic rings. Under `@media (prefers-reduced-motion: reduce)`, 3D canvas is static or simplified into a high-fidelity static image.
- Data updates: Numerical values flash a brief 300ms highlight upon real SSE snapshot arrival; no distracting ticker loops.

---

## 5. Accessibility & Keyboard Support
- WCAG 2.2 AA compliant contrast ratios across all text and interactive controls.
- Keyboard shortcut `⌘K` / `Ctrl+K` opens the quick search modal.
- `Escape` closes any modal, flyout drawer, or popover.
- Skip navigation link (`Skip to workspace`) provided on initial focus.
- All interactive tables support arrow key navigation and focusable row actions.
