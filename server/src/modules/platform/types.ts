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
  status: "created" | "submitted" | "acknowledged" | "processing" | "settled" | "failed" | "reversed" | "approved" | "rejected";
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
  projectName?: string;
  bankName?: string;
  accountNumber?: string;
  provider: string;
  providerMode: string;
  currency: string;
  reportedBalance?: string;
  restrictedBalance?: string;
  availableBalance: string;
  pendingBalance: string;
  status: "active" | "mock" | "pending_configuration";
  lastVerifiedAt?: string;
}

export interface EscrowRelease {
  id: string;
  accountId: string;
  entityId: string;
  amount: string;
  currency: string;
  reason: string;
  evidenceDoc: string;
  makerId: string;
  checkerId?: string;
  status: "pending" | "approved" | "rejected" | "disbursed";
  createdAt: string;
  approvedAt?: string;
}

export interface EscrowRestriction {
  id: string;
  accountId: string;
  entityId: string;
  type: "regulatory_escrow" | "collateral_lien" | "judicial_hold";
  amount: string;
  currency: string;
  evidenceDoc: string;
  effectiveDate: string;
}

export interface Statement {
  id: string;
  accountId: string;
  entityId: string;
  statementDate: string;
  currency: string;
  openingBalance: string;
  closingBalance: string;
  status: "reconciled" | "partial" | "unreconciled";
  importedAt: string;
}

export interface Collection {
  id: string;
  entityId: string;
  provider: "stripe" | "telr" | "amazon_ps";
  providerRef: string;
  merchantAccount: string;
  amount: string;
  currency: string;
  fee: string;
  netAmount: string;
  status: "captured" | "in_transit" | "settled" | "disputed" | "refunded";
  payoutRef?: string;
  settlementDate?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  entityId: string;
  provider: "stripe" | "telr" | "amazon_ps";
  payoutRef: string;
  grossAmount: string;
  fees: string;
  netAmount: string;
  currency: string;
  settlementDate: string;
  bankAccountId?: string;
  bankTxId?: string;
  status: "unmatched" | "matched" | "exception";
}

export interface OutboundPayment {
  id: string;
  entityId: string;
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: string;
  currency: string;
  valueDate: string;
  reason: string;
  makerId: string;
  checkerId?: string;
  status: "draft" | "pending_approval" | "approved" | "submitted" | "acknowledged" | "settled" | "rejected";
  kyribaReference?: string;
  events: PaymentTrackingEvent[];
  createdAt: string;
}

export interface ConnectorStatus {
  id: string;
  entityId: string;
  name: string;
  type: "treasury_system" | "payment_gateway" | "bank_feed";
  status: "unconfigured" | "test_mode" | "connected" | "error";
  lastSync?: string;
  capabilities: string[];
  notes: string;
}

export interface AgentRun {
  id: string;
  entityId: string;
  agentName: string;
  trigger: string;
  status: "running" | "completed" | "flagged";
  proposalsCount: number;
  evidence: Record<string, any>;
  summary: string;
  createdAt: string;
}

export interface CashPosition {
  entityId: string;
  currency: string;
  bankCash: string;
  restrictedCash: string;
  reservations: string;
  availableCash: string;
  undrawnFacilities: string;
  unreconciledValue: string;
  pendingApprovalsCount: number;
  asOf: string;
  evidence: {
    bankBalanceVerified: boolean;
    restrictionRecordsVerified: boolean;
    sourceTimestamp: string;
  };
  sourcesCount: number;
}

export interface Approval {
  id: string;
  entityId: string;
  subjectType: "invoice" | "payment" | "escrow" | "bank_account" | "period";
  subjectId: string;
  action: string;
  makerId: string;
  checkerId?: string;
  payloadHash?: string;
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
  escrowReleases: EscrowRelease[];
  escrowRestrictions: EscrowRestriction[];
  statements: Statement[];
  collections: Collection[];
  settlements: Settlement[];
  outboundPayments: OutboundPayment[];
  connectors: ConnectorStatus[];
  agentRuns: AgentRun[];
  approvals: Approval[];
  auditEvents: PlatformAuditEvent[];
}
