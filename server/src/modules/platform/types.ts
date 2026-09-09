export interface LegalEntity {
  tenantId: string;
  id: string;
  code: string;
  legalName: string;
  country: string;
  baseCurrency: string;
  taxId: string;
  status: "active" | "pending_approval";
  version: number;
}

export interface Customer {
  id: string;
  legalEntityId: string;
  code: string;
  legalName: string;
  taxId: string;
  terms: string;
  creditStatus: "approved" | "review" | "blocked";
  owner: string;
  status: "active" | "draft";
  version: number;
}

export interface Invoice {
  id: string;
  entityId: string;
  customerId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: string;
  openAmount: string;
  status: "draft" | "approved" | "issued" | "partially_paid" | "paid" | "closed";
  version: number;
}

export interface BankAccount {
  id: string;
  entityId: string;
  bankName: string;
  maskedAccount: string;
  currency: string;
  feedProvider: string;
  availableBalance: string;
  status: "active" | "review";
}

export interface PaymentTrackingEvent {
  id: string;
  status: "created" | "submitted" | "acknowledged" | "processing" | "settled" | "failed" | "reversed";
  occurredAt: string;
  source: string;
}

export interface Payment {
  id: string;
  entityId: string;
  customerId: string;
  direction: "inbound" | "outbound";
  amount: string;
  currency: string;
  valueDate: string;
  trackingNumber: string;
  status: PaymentTrackingEvent["status"];
  events: PaymentTrackingEvent[];
}

export interface EscrowAccount {
  id: string;
  entityId: string;
  provider: "KRIBA";
  providerMode: "mock-pending-vendor-validation";
  currency: string;
  availableBalance: string;
  pendingBalance: string;
  status: "mock" | "pending_configuration";
}

export interface Approval {
  id: string;
  entityId: string;
  subjectType: "invoice" | "payment" | "escrow" | "bank_account" | "period";
  subjectId: string;
  action: string;
  makerId: string;
  checkerId?: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
}

export interface PlatformAuditEvent {
  id: string;
  entityId: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  correlationId: string;
  occurredAt: string;
}

export interface PlatformState {
  legalEntities: LegalEntity[];
  customers: Customer[];
  invoices: Invoice[];
  bankAccounts: BankAccount[];
  payments: Payment[];
  escrowAccounts: EscrowAccount[];
  approvals: Approval[];
  auditEvents: PlatformAuditEvent[];
}

