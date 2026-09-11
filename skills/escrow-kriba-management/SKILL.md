---
name: escrow-kriba-management
description: Management and automated segregation of restricted escrow funds, KRIBA project disbursements, and regulatory lien tracking.
---

# Escrow & KRIBA Management Skill

## Purpose
Governs segregated escrow accounts, project escrow requirements under real estate/infrastructure development guidelines, and automated lien tracking.

## Core Rules
1. **Balance Segregation**:
   - Escrow balances are held in segregated bank accounts and cannot be pooled or netted against general operating cash.
   - Restrict balance calculations:
     ```typescript
     AvailableOperatingCash = TotalCash - EscrowRestrictedBalances;
     ```
2. **Disbursement Milestones**:
   - Payments from escrow accounts require milestone verification certificates (e.g., Engineer Certificate or Project Delivery Proof).
   - Each disbursement requires Maker-Checker signoff plus third-party trustee verification.
3. **Audit Trail**:
   - Every escrow deposit and draw is timestamped and mapped to the specific development project or contractual milestone ID.
