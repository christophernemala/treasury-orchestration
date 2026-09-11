---
name: liquidity-forecasting
description: Algorithms and predictive heuristics for daily (T+7), weekly (T+30), and monthly cash flow forecasting, liquidity buffer monitoring, and variance analysis.
---

# Liquidity Forecasting Skill

## Purpose
Enables deterministic calculation of expected cash inflows and outflows across operating entities, detecting liquidity shortfalls before they occur and calculating optimal buffer ratios.

## Forecasting Horizon Matrix
| Horizon | Granularity | Data Sources | Confidence Level |
|---|---|---|---|
| **Short-Term (T+7)** | Daily | Confirmed AP payment batches, cleared AR collections, payroll schedule | 95% - 98% |
| **Medium-Term (T+30)** | Weekly | Approved sales orders, recurring supplier contracts, tax deadlines | 80% - 90% |
| **Long-Term (T+90)** | Monthly | Rolling revenue pipeline, CapEx plans, loan amortizations | 70% - 80% |

## Core Algorithms
1. **Net Daily Cash Position**:
   ```typescript
   OpeningBalance + Sum(ClearedCollections) - Sum(ScheduledDisbursements) = ClosingCash
   ```
2. **Buffer Coverage Ratio (BCR)**:
   ```typescript
   BCR = AvailableCash / AverageDailyCashBurn
   // Minimum Threshold: BCR >= 30 days
   ```
3. **Variance Tracking**:
   Compares Day 0 forecasted closing cash with Day 1 actual cleared bank balances, generating variance alerts if `abs(Forecast - Actual) / Forecast > 5%`.
