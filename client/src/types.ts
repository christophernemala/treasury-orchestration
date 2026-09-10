export type TxStatus = 'matched' | 'suggested' | 'unmatched' | 'exception';

export interface Transaction {
  id: string;
  date: string;
  valueDate: string;
  description: string;
  amount: number;
  currency: string;
  account: string;
  reference: string;
  status: TxStatus;
  counterparty: string;
  category: string;
  notes?: string;
  matchedJournalId?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface CashPositionAccount {
  accountId: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  bankBalance: string;
  restrictedHold: string;
  operatingCash: string;
  availableCash: string;
  lastUpdated: string;
}

export interface CashPosition {
  tenantId: string;
  entityId?: string;
  currency: string;
  bankCash: string;
  restrictedCash: string;
  reservations: string;
  availableCash: string;
  undrawnFacilities: string;
  asOf: string;
  calculatedAt: string;
  definition: string;
  source: string;
  accountCount: number;
  accounts: CashPositionAccount[];
  supportingRecords: {
    statementIds: string[];
    escrowAccountIds: string[];
  };
}

export interface Statement {
  id: string;
  tenantId: string;
  entityId: string;
  accountId: string;
  statementDate: string;
  currency: string;
  openingBalance: string;
  closingBalance: string;
  source: string;
  status: string;
  lineCount: number;
  importedAt: string;
  checksum: string;
}

export interface Collection {
  id: string;
  tenantId: string;
  entityId: string;
  provider: 'stripe' | 'telr' | 'amazon_ps';
  merchantAccountId: string;
  originalCurrency: string;
  grossAmount: string;
  feeAmount: string;
  refundAmount: string;
  netSettlementAmount: string;
  settlementCurrency: string;
  providerStatus: string;
  normalizedStatus: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  tenantId: string;
  entityId: string;
  provider: string;
  payoutReference: string;
  grossAmount: string;
  fees: string;
  netAmount: string;
  currency: string;
  bankAccountId: string;
  statementLineId?: string;
  status: 'pending' | 'matched' | 'exception';
  matchedAt?: string;
}

export interface OutboundPayment {
  id: string;
  tenantId: string;
  entityId: string;
  bankAccountId: string;
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: string;
  currency: string;
  executionStatus: string;
  approvalId?: string;
  approvalStatus: string;
  makerId: string;
  createdAt: string;
}

export interface EscrowAccount {
  id: string;
  tenantId: string;
  entityId: string;
  projectName: string;
  bankAccountId: string;
  currency: string;
  reportedBalance: string;
  restrictedAmount: string;
  availableForRelease: string;
  asOf: string;
}

export interface EscrowRelease {
  id: string;
  tenantId: string;
  entityId: string;
  escrowAccountId: string;
  requestedAmount: string;
  currency: string;
  status: string;
  approvalId?: string;
  makerId: string;
  reason: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  tenantId: string;
  entityId: string;
  actionType: string;
  payloadDigest: string;
  payloadSummary: any;
  status: string;
  makerId: string;
  checkerId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  type: string;
  status: 'unconfigured' | 'test_mode' | 'connected' | 'error';
  lastSyncAt?: string;
  details?: any;
  error?: string;
}

export interface AgentRun {
  id: string;
  tenantId: string;
  agentId: string;
  runType: string;
  status: string;
  inputSummary: any;
  proposalCount: number;
  proposals: any[];
  evidenceCount: number;
  startedAt: string;
  completedAt?: string;
}

export interface TreasurySnapshot {
  reconciliation: {
    total: number;
    matched: number;
    suggested: number;
    unmatched: number;
    exception: number;
    matchRate: number;
  };
  balances: { account: string; currency: string; balance: number }[];
  generatedAt: string;
  dataMode: string;
}

export interface DashboardData extends TreasurySnapshot {
  unapplied: { count: number; total: number };
  statements: any[];
  agentTasks: any[];
  audit: any[];
}
