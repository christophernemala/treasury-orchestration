---
name: cash-position-audit
description: Procedures and validation steps for calculating and auditing consolidated cash positions, restricted cash, escrow balances, and control totals.
---

# Cash Position Audit Skill

## Purpose
Establishes the calculation rules and audit procedures for determining available corporate liquidity without double-counting restricted or reserved assets.

## Mathematical Invariants
- `Available Cash = Bank Cash - Restricted Cash - Unsettled Reservations`
- Restricted cash includes escrow balances, bank collateral liens, and court/regulatory holds.
- Operating liquidity must exclude any restricted deposit accounts.
- When generating reports, calculate control totals for debits, credits, opening balances, and net position.
