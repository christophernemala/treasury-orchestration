import type { PlatformState } from "./types.js";

const occurredAt = "2026-09-01T08:30:00.000Z";

export function createPlatformSeed(): PlatformState {
  return {
    legalEntities: [
      { tenantId: "tenant-northstar", id: "le-northstar-ae", code: "NS-AE", legalName: "Northstar Holdings UAE", country: "AE", baseCurrency: "AED", taxId: "TRN-***-1042", status: "active", version: 3 },
      { tenantId: "tenant-northstar", id: "le-northstar-difc", code: "NS-DIFC", legalName: "Northstar Treasury Services DIFC", country: "AE", baseCurrency: "USD", taxId: "DIFC-***-7781", status: "active", version: 2 },
    ],
    customers: [
      { id: "cus-gulf-retail", legalEntityId: "le-northstar-ae", code: "CUS-1008", legalName: "Gulf Retail LLC", taxId: "TRN-***-8820", terms: "Net 30", creditStatus: "approved", owner: "Sara Malik", status: "active", version: 4 },
      { id: "cus-atlas", legalEntityId: "le-northstar-difc", code: "CUS-1014", legalName: "Atlas Distribution FZE", taxId: "TRN-***-4402", terms: "Net 45", creditStatus: "review", owner: "Omar Nasser", status: "active", version: 2 },
      { id: "cus-horizon", legalEntityId: "le-northstar-ae", code: "CUS-1021", legalName: "Horizon Mobility PJSC", taxId: "TRN-***-1974", terms: "Net 30", creditStatus: "approved", owner: "Layla Ahmad", status: "active", version: 1 },
    ],
    invoices: [
      { id: "inv-24081", entityId: "le-northstar-ae", customerId: "cus-gulf-retail", number: "INV-24081", issueDate: "2026-08-01", dueDate: "2026-08-31", currency: "AED", total: "2350000.00", openAmount: "0.00", status: "paid", version: 5 },
      { id: "inv-24096", entityId: "le-northstar-difc", customerId: "cus-atlas", number: "INV-24096", issueDate: "2026-08-14", dueDate: "2026-09-28", currency: "USD", total: "620000.00", openAmount: "240000.00", status: "partially_paid", version: 3 },
      { id: "inv-24107", entityId: "le-northstar-ae", customerId: "cus-horizon", number: "INV-24107", issueDate: "2026-08-28", dueDate: "2026-09-27", currency: "AED", total: "1485000.00", openAmount: "1485000.00", status: "issued", version: 1 },
    ],
    bankAccounts: [
      { id: "ba-aed-4921", entityId: "le-northstar-ae", bankName: "Emirates NBD", maskedAccount: "•••• 4921", currency: "AED", feedProvider: "Direct ISO 20022 Host-to-Host", availableBalance: "12642750.00", status: "active" },
      { id: "ba-aed-8302", entityId: "le-northstar-ae", bankName: "First Abu Dhabi Bank", maskedAccount: "•••• 8302", currency: "AED", feedProvider: "MT940 Automated Feed", availableBalance: "4850000.00", status: "active" },
      { id: "ba-usd-1840", entityId: "le-northstar-difc", bankName: "HSBC UAE", maskedAccount: "•••• 1840", currency: "USD", feedProvider: "SWIFT Alliance Lite2", availableBalance: "2015500.00", status: "active" },
    ],
    payments: [
      { id: "pay-gr-88912", entityId: "le-northstar-ae", customerId: "cus-gulf-retail", direction: "inbound", amount: "2350000.00", currency: "AED", valueDate: "2026-08-29", trackingNumber: "GR-88912", status: "settled", events: [
        { id: "pte-1", status: "acknowledged", occurredAt: "2026-08-29T07:58:00Z", source: "mock-bank-feed" },
        { id: "pte-2", status: "processing", occurredAt: "2026-08-29T08:03:00Z", source: "mock-bank-feed" },
        { id: "pte-3", status: "settled", occurredAt: "2026-08-29T08:06:00Z", source: "reviewed-statement" },
      ] },
      { id: "pay-atlas-4402", entityId: "le-northstar-difc", customerId: "cus-atlas", direction: "inbound", amount: "380000.00", currency: "USD", valueDate: "2026-08-28", trackingNumber: "WIRE-4402", status: "processing", events: [
        { id: "pte-4", status: "acknowledged", occurredAt: "2026-08-28T11:30:00Z", source: "mock-bank-feed" },
        { id: "pte-5", status: "processing", occurredAt: "2026-08-28T11:44:00Z", source: "mock-bank-feed" },
      ] },
    ],
    escrowAccounts: [
      { id: "esc-kriba-aed", entityId: "le-northstar-ae", projectName: "Project Marina Heights", bankName: "Emirates NBD Escrow", accountNumber: "ESC-AED-9921", provider: "KRIBA", providerMode: "mock-pending-vendor-validation", currency: "AED", reportedBalance: "3500000.00", restrictedBalance: "3500000.00", availableBalance: "0.00", pendingBalance: "0.00", status: "active", lastVerifiedAt: "2026-09-09T16:00:00Z" },
      { id: "esc-difc-col", entityId: "le-northstar-difc", projectName: "DIFC Trade Collateral", bankName: "HSBC Escrow", accountNumber: "ESC-USD-1104", provider: "HSBC Trustee", providerMode: "direct-audited", currency: "USD", reportedBalance: "500000.00", restrictedBalance: "500000.00", availableBalance: "0.00", pendingBalance: "0.00", status: "active", lastVerifiedAt: "2026-09-09T15:30:00Z" },
    ],
    escrowReleases: [
      { id: "esr-001", accountId: "esc-kriba-aed", entityId: "le-northstar-ae", amount: "500000.00", currency: "AED", reason: "Milestone 3 Engineering Signoff", evidenceDoc: "DOC-CERT-ENG-03.pdf", makerId: "usr-treasury", status: "pending", createdAt: "2026-09-08T14:20:00Z" }
    ],
    escrowRestrictions: [
      { id: "res-001", accountId: "esc-kriba-aed", entityId: "le-northstar-ae", type: "regulatory_escrow", amount: "350000.00", currency: "AED", evidenceDoc: "RERA-ESCROW-DECREE-88.pdf", effectiveDate: "2026-01-15" }
    ],
    statements: [
      { id: "stmt-enbd-0826", accountId: "ba-aed-4921", entityId: "le-northstar-ae", statementDate: "2026-08-31", currency: "AED", openingBalance: "10292750.00", closingBalance: "12642750.00", status: "reconciled", importedAt: "2026-09-01T06:00:00Z" },
      { id: "stmt-fab-0826", accountId: "ba-aed-8302", entityId: "le-northstar-ae", statementDate: "2026-08-31", currency: "AED", openingBalance: "4850000.00", closingBalance: "4850000.00", status: "reconciled", importedAt: "2026-09-01T06:15:00Z" },
    ],
    collections: [
      { id: "col-str-9901", entityId: "le-northstar-ae", provider: "stripe", providerRef: "ch_3N8zJ7K1", merchantAccount: "acct_northstar_ae", amount: "142500.00", currency: "AED", fee: "4275.00", netAmount: "138225.00", status: "settled", payoutRef: "po_stripe_0901", settlementDate: "2026-09-02", createdAt: "2026-09-01T10:00:00Z" },
      { id: "col-tlr-4412", entityId: "le-northstar-ae", provider: "telr", providerRef: "telr_ord_4412", merchantAccount: "mid_telr_8820", amount: "85000.00", currency: "AED", fee: "2125.00", netAmount: "82875.00", status: "in_transit", payoutRef: "po_telr_0904", settlementDate: "2026-09-04", createdAt: "2026-09-02T11:30:00Z" },
    ],
    settlements: [
      { id: "set-str-0901", entityId: "le-northstar-ae", provider: "stripe", payoutRef: "po_stripe_0901", grossAmount: "142500.00", fees: "4275.00", netAmount: "138225.00", currency: "AED", settlementDate: "2026-09-02", bankAccountId: "ba-aed-4921", bankTxId: "tx-001", status: "matched" },
      { id: "set-tlr-0904", entityId: "le-northstar-ae", provider: "telr", payoutRef: "po_telr_0904", grossAmount: "85000.00", fees: "2125.00", netAmount: "82875.00", currency: "AED", settlementDate: "2026-09-04", status: "unmatched" },
    ],
    outboundPayments: [
      { id: "out-pay-001", entityId: "le-northstar-ae", beneficiaryName: "Al-Futtaim Logistics", beneficiaryIban: "AE290330000000123456789", amount: "450000.00", currency: "AED", valueDate: "2026-09-12", reason: "Quarterly Supply Chain Clearing", makerId: "usr-treasury", status: "pending_approval", kyribaReference: "KYR-REQ-88910", events: [{ id: "pe-1", status: "created", occurredAt: "2026-09-09T14:00:00Z", source: "treasury-portal" }], createdAt: "2026-09-09T14:00:00Z" },
      { id: "out-pay-002", entityId: "le-northstar-difc", beneficiaryName: "DIFC Gate Holdings", beneficiaryIban: "AE440260000000987654321", amount: "120000.00", currency: "USD", valueDate: "2026-09-10", reason: "Executive Suite Commercial Lease", makerId: "usr-treasury", checkerId: "usr-admin", status: "approved", kyribaReference: "KYR-REQ-88911", events: [{ id: "pe-2", status: "approved", occurredAt: "2026-09-09T16:30:00Z", source: "maker-checker-gateway" }], createdAt: "2026-09-09T15:10:00Z" },
    ],
    connectors: [
      { id: "conn-kyriba", entityId: "le-northstar-ae", name: "Kyriba Treasury Gateway", type: "treasury_system", status: "test_mode", lastSync: "2026-09-09T18:00:00Z", capabilities: ["Balance Polling", "Payment Order Dispatch", "CAMT File Routing"], notes: "Operational in test sandbox; live payment execution approval-gated." },
      { id: "conn-stripe", entityId: "le-northstar-ae", name: "Stripe Corporate Acquiring", type: "payment_gateway", status: "connected", lastSync: "2026-09-09T20:30:00Z", capabilities: ["Webhook Settlement Feed", "Gross vs Net Reconciliation", "Fee Splitting"], notes: "Reconciling net payouts to Emirates NBD account." },
      { id: "conn-enbd-h2h", entityId: "le-northstar-ae", name: "Emirates NBD Host-to-Host", type: "bank_feed", status: "connected", lastSync: "2026-09-09T21:00:00Z", capabilities: ["ISO 20022 Realtime Feed", "Intraday Balances", "Transaction Status Reports"], notes: "Primary clearing account feed." }
    ],
    agentRuns: [
      { id: "run-ta-0909", entityId: "le-northstar-ae", agentName: "TA–01 Liquidity Guard", trigger: "Automated Daily Cash Consolidation", status: "completed", proposalsCount: 2, summary: "Consolidated AED 17,492,750 bank balances across Emirates NBD and FAB. Segregated AED 3,500,000 in escrow. Detected AED 450,000 pending reservation.", evidence: { verifiedBankCash: "17492750.00", segregatedEscrow: "3500000.00", reservations: "450000.00", calculatedAvailableCash: "13542750.00" }, createdAt: "2026-09-09T21:15:00Z" },
      { id: "run-ta-0908", entityId: "le-northstar-ae", agentName: "TA–01 Reconciliation Agent", trigger: "Inbound Statement Ingestion", status: "completed", proposalsCount: 3, summary: "Proposed 3 high-confidence journal matches against Gulf Retail payments. Zero unreconciled balance variance.", evidence: { matchedCount: 3, variance: "0.00" }, createdAt: "2026-09-08T18:30:00Z" },
    ],
    approvals: [
      { id: "apr-inv-close", entityId: "le-northstar-ae", subjectType: "invoice", subjectId: "inv-24081", action: "Close paid invoice after journal verification", makerId: "usr-treasury", status: "pending" },
      { id: "apr-bank-master", entityId: "le-northstar-difc", subjectType: "bank_account", subjectId: "ba-usd-1840", action: "Approve bank master feed configuration", makerId: "usr-treasury", status: "pending" },
      { id: "apr-out-pay-001", entityId: "le-northstar-ae", subjectType: "payment", subjectId: "out-pay-001", action: "Approve vendor settlement AED 450,000.00 to Al-Futtaim Logistics", makerId: "usr-treasury", status: "pending" },
      { id: "apr-esc-rel-001", entityId: "le-northstar-ae", subjectType: "escrow", subjectId: "esr-001", action: "Approve project escrow release AED 500,000.00 for Milestone 3", makerId: "usr-treasury", status: "pending" }
    ],
    auditEvents: [
      { id: "paud-1", entityId: "le-northstar-ae", actorId: "system", action: "platform.seeded", subjectType: "workspace", subjectId: "treasury-atom", correlationId: "seed-correlation", occurredAt },
      { id: "paud-2", entityId: "le-northstar-ae", actorId: "usr-treasury", action: "invoice.payment_allocated", subjectType: "invoice", subjectId: "inv-24081", correlationId: "corr-inv-24081", occurredAt: "2026-08-29T08:07:00Z" },
    ],
  };
}
