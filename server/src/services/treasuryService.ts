import { store } from "../store/memoryStore.js";
import { reconciliationSummary } from "./reconciliation.js";

export function buildTreasurySnapshot() {
  const balances = Object.values(
    store.state.statements.reduce<
      Record<string, { account: string; currency: string; balance: number }>
    >((result, statement) => {
      result[statement.account] = {
        account: statement.account,
        currency: statement.currency,
        balance: statement.closingBalance,
      };
      return result;
    }, {}),
  );

  return {
    balances,
    reconciliation: reconciliationSummary(store.state.transactions),
    generatedAt: new Date().toISOString(),
    dataMode: "seeded-development",
  };
}
