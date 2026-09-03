import type { PlatformState } from "./types.js";

const occurredAt = "2026-09-01T08:30:00.000Z";

export function createPlatformSeed(): PlatformState {
  return {
    legalEntities: [
      { id: "le-northstar-ae", code: "NS-AE", legalName: "Northstar Holdings UAE", country: "AE", baseCurrency: "AED", taxId: "TRN-***-1042", status: "active", version: 3 },
      { id: "le-northstar-difc", code: "NS-DIFC", legalName: "Northstar Treasury Services DIFC", country: "AE", baseCurrency: "USD", taxId: "DIFC-***-7781", status: "active", version: 2 },
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
      { id: "ba-aed-4921", entityId: "le-northstar-ae", bankName: "Emirates NBD", maskedAccount: "•••• 4921", currency: "AED", feedProvider: "CSV statement", availableBalance: "12642750.00", status: "review" },
      { id: "ba-usd-1840", entityId: "le-northstar-difc", bankName: "HSBC UAE", maskedAccount: "•••• 1840", currency: "USD", feedProvider: "XLSX statement", availableBalance: "2015500.00", status: "active" },
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
      { id: "esc-kriba-aed", entityId: "le-northstar-ae", provider: "KRIBA", providerMode: "mock-pending-vendor-validation", currency: "AED", availableBalance: "0.00", pendingBalance: "0.00", status: "pending_configuration" },
    ],
    approvals: [
      { id: "apr-inv-close", entityId: "le-northstar-ae", subjectType: "invoice", subjectId: "inv-24081", action: "Close paid invoice after journal verification", makerId: "usr-treasury", status: "pending" },
      { id: "apr-bank-master", entityId: "le-northstar-difc", subjectType: "bank_account", subjectId: "ba-usd-1840", action: "Approve bank master feed configuration", makerId: "usr-treasury", status: "pending" },
    ],
    auditEvents: [
      { id: "paud-1", entityId: "le-northstar-ae", actorId: "system", action: "platform.seeded", subjectType: "workspace", subjectId: "treasury-atom", correlationId: "seed-correlation", occurredAt },
      { id: "paud-2", entityId: "le-northstar-ae", actorId: "usr-treasury", action: "invoice.payment_allocated", subjectType: "invoice", subjectId: "inv-24081", correlationId: "corr-inv-24081", occurredAt: "2026-08-29T08:07:00Z" },
    ],
  };
}

