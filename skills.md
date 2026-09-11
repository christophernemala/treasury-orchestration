# Skills Catalog — Treasury Atom

Index of specialized agent capabilities, financial math algorithms, and operational workflows embedded in Treasury Atom:

| Skill Name | Path | Purpose | Key Mathematical / Operational Rule |
|---|---|---|---|
| **treasury-reconciliation** | [`skills/treasury-reconciliation/SKILL.md`](skills/treasury-reconciliation/SKILL.md) | Bank statement ingestion, multi-criteria heuristic matching against GL, and audit trails. | Date window (±2 days exact, ±5 days fuzzy), exact decimal amount match, reference substring. |
| **cash-position-audit** | [`skills/cash-position-audit/SKILL.md`](skills/cash-position-audit/SKILL.md) | Real-time consolidated cash calculation, restricted cash segregation, and control totals. | `Available Cash = Total Bank Cash - Restricted Cash - Unsettled Reservations`. |
| **liquidity-forecasting** | [`skills/liquidity-forecasting/SKILL.md`](skills/liquidity-forecasting/SKILL.md) | Multi-horizon cash flow projections (T+7 daily, T+30 weekly, T+90 monthly) and buffer analysis. | Buffer Coverage Ratio (`BCR = AvailableCash / DailyBurn >= 30 days`), variance tracking. |
| **maker-checker-governance** | [`skills/maker-checker-governance/SKILL.md`](skills/maker-checker-governance/SKILL.md) | Dual-control enforcement, authorization thresholds, and tamper-proof approval logging. | `makerId !== checkerId`; tiered thresholds (<50k, 50k-500k, >500k dual signature). |
| **escrow-kriba-management** | [`skills/escrow-kriba-management/SKILL.md`](skills/escrow-kriba-management/SKILL.md) | Segregated project escrow accounts, milestone-based disbursements, and lien tracking. | Strict non-pooling policy; external engineer certification requirement for drawdowns. |

---

## Agent Invocation Pattern
To execute a skill within an agent workflow:
```typescript
import { executeSkill } from "./server/src/modules/platform/agentEngine";

const result = await executeSkill({
  skillName: "treasury-reconciliation",
  tenantId: context.tenantId,
  legalEntityIds: context.legalEntityIds,
  params: { statementId: "stmt_2026_09_001" }
});
```
