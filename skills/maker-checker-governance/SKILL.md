---
name: maker-checker-governance
description: Operational enforcement of dual-control policies, separation of duties, threshold authorization matrices, and tamper-proof audit logging.
---

# Maker-Checker Governance Skill

## Purpose
Ensures that no high-risk treasury action (payments, escrow disbursements, reconciliation approvals, manual GL journals) can be initiated and finalized by a single individual.

## Dual Control Rules
1. **Separation of Roles**:
   - `Maker`: Prepares, uploads, or proposes a transaction, statement match, or journal.
   - `Checker`: Independent verified officer who inspects evidence, reviews math, and approves or rejects.
   - Invariant: `makerId !== checkerId`.
2. **Approval Threshold Matrix**:
   | Amount Range (AED) | Required Approvers | SLA Window |
   |---|---|---|
   | `< 50,000` | Single Checker | 4 hours |
   | `50,000 – 500,000` | Senior Finance Controller | 2 hours |
   | `> 500,000` | Dual Checkers (Finance Director + Treasury Head) | 1 hour |
3. **Audit Recording**:
   Every approval action generates an immutable audit receipt containing:
   `{ auditId, timestamp, action, makerId, checkerId, entityId, hash, reason }`.
