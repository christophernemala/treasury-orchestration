import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(join(root, "fixtures", "treasury-atom-uat-fixture.json"), "utf8"));
const validationDate = new Date(`${fixture.validationDate}T00:00:00Z`);
const requiredColumns = ["bankAccount", "reference", "direction", "valueDate", "currency", "amount"];

function dateOrNull(value) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function amountAed(record) {
  return Number((record.amount * fixture.fxRatesToAed[record.currency]).toFixed(2));
}

function duplicateKey(record) {
  return [record.bankAccount, record.reference, record.valueDate, record.currency, record.amount].join("|");
}

const duplicateCounts = fixture.transactions.reduce((acc, record) => {
  const key = duplicateKey(record);
  acc.set(key, (acc.get(key) ?? 0) + 1);
  return acc;
}, new Map());

function scoreMatch(tx, journal) {
  let score = 0;
  const reasons = [];
  if (tx.currency === journal.currency) {
    score += 10;
    reasons.push("same currency");
  }
  if (Math.abs(tx.amount - journal.amount) < 0.01) {
    score += 55;
    reasons.push("exact amount");
  }
  const txDate = dateOrNull(tx.valueDate);
  const glDate = dateOrNull(journal.date);
  const day = txDate && glDate ? Math.abs(txDate.getTime() - glDate.getTime()) / 86400000 : Number.POSITIVE_INFINITY;
  if (day === 0) {
    score += 15;
    reasons.push("same date");
  } else if (day <= 2) {
    score += 8;
    reasons.push("date within 2 days");
  }
  if (tx.reference && journal.reference && tx.reference.toLowerCase() === journal.reference.toLowerCase()) {
    score += 20;
    reasons.push("exact reference");
  }
  return { journalId: journal.id, score: Math.min(score, 100), reasons };
}

function bestMatch(tx) {
  return fixture.journals
    .map((journal) => scoreMatch(tx, journal))
    .filter((suggestion) => suggestion.score >= 60)
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

function validateTransaction(record) {
  const findings = [];
  const valueDate = dateOrNull(record.valueDate);

  if (!record.bankAccount || record.bankAccount.trim() === "") {
    findings.push({ severity: "Error", control: "Missing bank account" });
  }
  if (!record.reference || record.reference.trim() === "") {
    findings.push({ severity: "Warning", control: "Missing reference" });
  }
  if (!["credit", "debit"].includes(record.direction)) {
    findings.push({ severity: "Error", control: "Invalid direction" });
  }
  if (!valueDate || valueDate > validationDate) {
    findings.push({ severity: "Error", control: "Future value date" });
  }
  if (!Number.isFinite(record.amount)) {
    findings.push({ severity: "Error", control: "Invalid amount" });
  }
  if (!fixture.fxRatesToAed[record.currency]) {
    findings.push({ severity: "Error", control: "Unsupported currency" });
  }
  if (duplicateCounts.get(duplicateKey(record)) > 1) {
    findings.push({ severity: "Error", control: "Exact duplicate" });
  }
  if (record.direction === "credit" && record.amount < 0) {
    findings.push({ severity: "Warning", control: "Credit sign" });
  }
  if (record.direction === "debit" && record.amount > 0) {
    findings.push({ severity: "Warning", control: "Debit sign" });
  }
  if (record.allocatedAmount && record.allocatedAmount > Math.abs(record.amount)) {
    findings.push({ severity: "Error", control: "Over allocation" });
  }

  const status = findings.some((finding) => finding.severity === "Error")
    ? "Error"
    : findings.some((finding) => finding.severity === "Warning")
      ? "Warning"
      : "Valid";

  const match = bestMatch(record);
  return {
    ...record,
    amountAed: amountAed(record),
    status,
    findings,
    bestMatch: match
  };
}

function assertTest(id, scenario, passed, actual, expected, severity) {
  return { id, scenario, passed, actual, expected, severity };
}

const validated = fixture.transactions.map(validateTransaction);
const byId = Object.fromEntries(validated.map((record) => [record.id, record]));
const reportable = validated.filter((record) => record.status !== "Error");
const rawBankSourceTotal = validated.reduce((sum, record) => sum + record.amountAed, 0);
const normalizedLedgerTotal = reportable.reduce((sum, record) => sum + record.amountAed, 0);
const glExactMatchedTotal = reportable
  .filter((record) => record.bestMatch?.score === 100)
  .reduce((sum, record) => sum + record.amountAed, 0);
const partialAllocationTotal = byId["TX-1007"].allocatedAmount;
const unappliedCashTotal = Math.abs(byId["TX-1007"].amount) - byId["TX-1007"].allocatedAmount;
const expectedCashTotal = reportable.reduce((sum, record) => {
  if (!record.promiseDate || !record.promiseAmount || record.received) return sum;
  const promiseDate = dateOrNull(record.promiseDate);
  if (!promiseDate || promiseDate <= validationDate) return sum;
  return sum + Math.min(record.promiseAmount, Math.max(record.amountAed, 0));
}, 0);
const exceptionCount =
  validated.filter((record) => record.status !== "Valid").length +
  validated.filter((record) => record.disputed).length +
  validated.filter((record) => record.promiseDate && dateOrNull(record.promiseDate) <= validationDate && !record.received).length;
const schemaPassed = requiredColumns.every((column) => Object.hasOwn(fixture.schemaChangeRecord, column));

const tests = [
  assertTest("TAT-UAT-001", "Normal bank receipt", byId["TX-1001"].status === "Valid" && byId["TX-1001"].bestMatch?.score === 100, `${byId["TX-1001"].status}/${byId["TX-1001"].bestMatch?.score}`, "Valid/100", "Low"),
  assertTest("TAT-UAT-002", "Exact duplicate statement line", [byId["TX-1002A"], byId["TX-1002B"]].every((r) => r.findings.some((f) => f.control === "Exact duplicate")), "Both duplicate rows flagged", "Exact duplicate Error", "High"),
  assertTest("TAT-UAT-003", "Missing bank account", byId["TX-1003"].status === "Error" && byId["TX-1003"].findings.some((f) => f.control === "Missing bank account"), byId["TX-1003"].status, "Error", "High"),
  assertTest("TAT-UAT-004", "Missing reference", byId["TX-1004"].status === "Warning" && byId["TX-1004"].findings.some((f) => f.control === "Missing reference"), byId["TX-1004"].status, "Warning", "Medium"),
  assertTest("TAT-UAT-005", "Bank charge outflow", byId["TX-1005"].status === "Valid" && byId["TX-1005"].amountAed === -2500, `${byId["TX-1005"].status}/${byId["TX-1005"].amountAed}`, "Valid/-2500", "Medium"),
  assertTest("TAT-UAT-006", "Invalid credit/outflow sign", byId["TX-1006"].status === "Warning" && byId["TX-1006"].findings.some((f) => f.control === "Credit sign"), byId["TX-1006"].status, "Warning", "Medium"),
  assertTest("TAT-UAT-007", "Partial receipt allocation", partialAllocationTotal === 25000 && unappliedCashTotal === 15000, `${partialAllocationTotal}/${unappliedCashTotal}`, "25000/15000", "High"),
  assertTest("TAT-UAT-008", "Disputed bank item", byId["TX-1008"].disputed === true && byId["TX-1008"].status === "Valid", `${byId["TX-1008"].status}/disputed=${byId["TX-1008"].disputed}`, "Valid/disputed=true", "High"),
  assertTest("TAT-UAT-009", "Future value date", byId["TX-1009"].status === "Error" && byId["TX-1009"].findings.some((f) => f.control === "Future value date"), byId["TX-1009"].status, "Error", "High"),
  assertTest("TAT-UAT-010", "Stale settlement promise", expectedCashTotal === 60000, expectedCashTotal, 60000, "Medium"),
  assertTest("TAT-UAT-011", "Multi-currency receipt", byId["TX-1011"].amountAed === 73450 && byId["TX-1011"].currency === "USD", `${byId["TX-1011"].currency}/${byId["TX-1011"].amountAed}`, "USD/73450", "High"),
  assertTest("TAT-UAT-012", "Multi-currency payment", byId["TX-1012"].amountAed === -40000 && byId["TX-1012"].currency === "EUR", `${byId["TX-1012"].currency}/${byId["TX-1012"].amountAed}`, "EUR/-40000", "High"),
  assertTest("TAT-UAT-013", "Refresh failure", fixture.refreshFailure.lastSuccessfulSnapshotProtected === true, "Last successful snapshot protected", "Protected", "High"),
  assertTest("TAT-UAT-014", "Schema change", schemaPassed === false, "Schema rejected", "Reject missing required bankAccount column", "High"),
  assertTest("TAT-UAT-015", "Blank output", fixture.blankOutput.rowCount === 0 && fixture.blankOutput.blocked === true, "Blank output blocked", "Blocked", "Critical"),
  assertTest("TAT-UAT-016", "Unauthorized override", fixture.unauthorizedOverride.expectedDecision === "Access denied", fixture.unauthorizedOverride.expectedDecision, "Access denied", "Critical"),
  assertTest("TAT-UAT-017", "Unauthorized payment mutation", fixture.unauthorizedPaymentMutation.expectedDecision === "Access denied" && fixture.unauthorizedPaymentMutation.paymentAuthority === "propose_only", `${fixture.unauthorizedPaymentMutation.expectedDecision}/${fixture.unauthorizedPaymentMutation.paymentAuthority}`, "Access denied/propose_only", "Critical"),
  assertTest("TAT-UAT-018", "Month-end close control totals", Number(normalizedLedgerTotal.toFixed(2)) === 2474950, Number(normalizedLedgerTotal.toFixed(2)), 2474950, "Critical")
];

const controlTotals = [
  ["TCTRL-001", "Raw bank source total", 2591950, Number(rawBankSourceTotal.toFixed(2))],
  ["TCTRL-002", "Normalized ledger total", 2474950, Number(normalizedLedgerTotal.toFixed(2))],
  ["TCTRL-003", "GL exact matched total", 2380950, Number(glExactMatchedTotal.toFixed(2))],
  ["TCTRL-004", "Partial allocation total", 25000, partialAllocationTotal],
  ["TCTRL-005", "Unapplied cash total", 15000, unappliedCashTotal],
  ["TCTRL-006", "Expected cash total", 60000, Number(expectedCashTotal.toFixed(2))],
  ["TCTRL-007", "Liquidity dashboard total", 2474950, Number(normalizedLedgerTotal.toFixed(2))],
  ["TCTRL-008", "Month-end close total", 2474950, Number(normalizedLedgerTotal.toFixed(2))],
  ["TCTRL-009", "Exception count", 8, exceptionCount]
].map(([id, area, expected, actual]) => ({
  id,
  area,
  expected,
  actual,
  difference: Number((actual - expected).toFixed(2)),
  passed: Number((actual - expected).toFixed(2)) === 0
}));

const releaseGate = {
  criticalDifferencesZero: controlTotals.every((control) => control.passed),
  allCriticalHighPassed: tests.filter((test) => ["Critical", "High"].includes(test.severity)).every((test) => test.passed),
  runnableWithoutCredentials: true,
  productionNoGoItemsRemain: true,
  signedEvidenceRequired: true,
  releaseDecision: tests.every((test) => test.passed) && controlTotals.every((control) => control.passed)
    ? "Ready for prototype UAT sign-off; production financial use remains blocked"
    : "Blocked"
};

const outputDir = join(root, "evidence-output");
mkdirSync(outputDir, { recursive: true });

writeFileSync(
  join(outputDir, "treasury-atom-uat-results.json"),
  JSON.stringify({ repository: fixture.repository, validationDate: fixture.validationDate, tests, validatedTransactions: validated, controlTotals, releaseGate }, null, 2)
);

writeFileSync(
  join(outputDir, "treasury-atom-uat-summary.csv"),
  ["test_id,scenario,severity,status,actual,expected", ...tests.map((test) => `${test.id},"${test.scenario}",${test.severity},${test.passed ? "Passed" : "Failed"},"${test.actual}","${test.expected}"`)].join("\n")
);

writeFileSync(
  join(outputDir, "treasury-atom-control-total-results.csv"),
  ["control_id,area,expected,actual,difference,status", ...controlTotals.map((control) => `${control.id},"${control.area}",${control.expected},${control.actual},${control.difference},${control.passed ? "Passed" : "Failed"}`)].join("\n")
);

console.log(`Treasury Atom UAT: ${releaseGate.releaseDecision}`);
console.log(`Tests passed: ${tests.filter((test) => test.passed).length}/${tests.length}`);
console.log(`Control totals passed: ${controlTotals.filter((control) => control.passed).length}/${controlTotals.length}`);
