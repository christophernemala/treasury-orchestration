---
name: treasury-reconciliation
description: Guidelines and algorithmic workflows for importing bank statements, proposing transaction matches against the general ledger, and recording maker-checker reconciliation decisions.
---

# Treasury Reconciliation Skill

## Purpose
This skill defines standard operating procedures and technical heuristics for reconciling bank statement lines with general ledger journals and payment settlement records in Treasury Atom.

## Ingestion Workflow
1. **Validation**: Check statement payload for required headers (`Date`, `ValueDate`, `Amount`, `Currency`, `Account`, `Reference`).
2. **Exact Decimal Parsing**: Parse amounts using 2-decimal precision. Reject non-numeric characters or ungrounded scientific notations.
3. **Deduplication**: Reject duplicate statements by checking `(bank_account_id, statement_date, checksum)`.
4. **Matching Heuristics**:
   - Exact Match: Date within ±2 business days, matching currency, exact amount match, reference ID substring match.
   - Suggested Match: Exact amount match and currency match with date window up to ±5 business days.
   - Exception: Unmatched transactions older than 14 days or amount mismatch > 0.01 AED.
5. **Maker-Checker Execution**:
   - Human controller reviews match suggestions.
   - System updates transaction status to `matched` and links `matchedJournalId`.
   - Immutable audit event recorded with actor ID, timestamp, and correlation identifier.
