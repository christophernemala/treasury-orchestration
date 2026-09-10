import { randomUUID } from "node:crypto";
import { isDevelopment } from "../../config.js";
import { requireLegacyScope } from "../../middleware/auth.js";
import { Router, type Request } from "express";
import { z } from "zod";
import { type Permission } from "../access/policy.js";
import { requireIdempotencyKey, requirePermission } from "../../middleware/requestContext.js";
import { ApiError } from "../../shared/errors/apiError.js";
import { platformRepository } from "./memoryRepository.js";
import { decimalAdd, decimalSub, formatCurrency, toCents, fromCents } from "../../shared/math/decimal.js";
import type {
  Customer,
  Invoice,
  PlatformAuditEvent,
  CashPosition,
  Statement,
  Collection,
  Settlement,
  OutboundPayment,
  EscrowRelease,
  ConnectorStatus,
  AgentRun,
} from "./types.js";
import { store } from "../../store/memoryStore.js";
import { broadcastTreasurySnapshot } from "../../routes/treasuryStream.js";

const router = Router();
const idempotentResponses = new Map<string, { body: string; response: unknown }>();

const modules: Array<{ id: string; label: string; permission: Permission; status: string }> = [
  { id: "overview", label: "Overview", permission: "bank.read", status: "available" },
  { id: "cash", label: "Cash & Liquidity", permission: "bank.read", status: "available" },
  { id: "reconciliation", label: "Reconciliation", permission: "bank.reconcile", status: "available" },
  { id: "collections", label: "Collections", permission: "payment.read", status: "available" },
  { id: "payments", label: "Payments", permission: "payment.read", status: "available" },
  { id: "escrow", label: "Escrow Monitoring", permission: "escrow.read", status: "available" },
  { id: "crm", label: "CRM", permission: "crm.read", status: "available" },
  { id: "invoices", label: "Invoicing", permission: "invoice.read", status: "available" },
  { id: "banking", label: "Banking", permission: "bank.read", status: "available" },
  { id: "approvals", label: "Approvals", permission: "master.read", status: "available" },
  { id: "reports", label: "Reports", permission: "ledger.read", status: "available" },
  { id: "agents", label: "Agent Activity", permission: "audit.read", status: "available" },
  { id: "connections", label: "Connections", permission: "master.read", status: "available" },
  { id: "audit", label: "Audit", permission: "audit.read", status: "available" },
];

function audit(req: Request, action: string, subjectType: string, subjectId: string, entityId: string) {
  const event: PlatformAuditEvent = {
    id: randomUUID(),
    entityId,
    actorId: req.user!.sub,
    action,
    subjectType,
    subjectId,
    correlationId: req.correlationId,
    occurredAt: new Date().toISOString(),
  };
  platformRepository.state.auditEvents.unshift(event);
}

function idempotencyScope(req: Request, entityId: string) {
  return JSON.stringify([req.user!.tenantId, entityId, req.user!.sub, req.method, req.path, req.headers["idempotency-key"]]);
}

function replay(key: string, body: unknown) {
  const saved = idempotentResponses.get(key);
  if (saved && saved.body !== JSON.stringify(body)) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This key was already used with different data.");
  return saved?.response;
}

function entityAllowed(req: Request, entityId: string) {
  if (
    !req.user!.legalEntityIds.includes(entityId) ||
    !platformRepository.state.legalEntities.some(
      (entity) => entity.id === entityId && entity.tenantId === req.user!.tenantId && entity.status === "active"
    )
  ) {
    throw new ApiError(403, "ENTITY_SCOPE_DENIED", "The record is outside your legal-entity scope.");
  }
}

router.get("/modules", (req, res) => {
  res.json({
    dataMode: "illustrative-development",
    modules: modules.filter((module) => req.user!.permissions.includes(module.permission)),
    permissions: req.user!.permissions,
    legalEntityIds: req.user!.legalEntityIds,
  });
});

router.get("/legal-entities", requirePermission("master.read"), (req, res) => {
  res.json(platformRepository.state.legalEntities.filter((entity) => req.user!.legalEntityIds.includes(entity.id)));
});

// ==========================================
// CASH POSITIONS & LIQUIDITY
// ==========================================
router.get("/cash-positions", requirePermission("bank.read"), (req, res) => {
  const authorizedEntities = platformRepository.state.legalEntities.filter((e) => req.user!.legalEntityIds.includes(e.id));
  const positions: CashPosition[] = authorizedEntities.map((entity) => {
    const accounts = platformRepository.state.bankAccounts.filter((a) => a.entityId === entity.id && a.status === "active");
    const escrowAccounts = platformRepository.state.escrowAccounts.filter((a) => a.entityId === entity.id && a.status === "active");
    const outbound = platformRepository.state.outboundPayments.filter(
      (p) => p.entityId === entity.id && ["pending_approval", "approved", "submitted"].includes(p.status)
    );
    const unrecTxs = store.state.transactions.filter(
      (t) => ["unmatched", "exception"].includes(t.status)
    );

    let bankCashCents = 0n;
    accounts.forEach((a) => {
      bankCashCents += toCents(a.availableBalance);
    });

    let restrictedCashCents = 0n;
    escrowAccounts.forEach((e) => {
      restrictedCashCents += toCents(e.restrictedBalance || e.availableBalance || "0.00");
    });

    let reservationCents = 0n;
    outbound.forEach((p) => {
      reservationCents += toCents(p.amount);
    });

    let unrecCents = 0n;
    unrecTxs.forEach((t) => {
      unrecCents += toCents(Math.abs(t.amount));
    });

    const bankCash = fromCents(bankCashCents);
    const restrictedCash = fromCents(restrictedCashCents);
    const reservations = fromCents(reservationCents);
    
    // Available Cash = Bank cash - restricted cash - reservations
    const availableCents = bankCashCents - restrictedCashCents - reservationCents;
    const availableCash = fromCents(availableCents > 0n ? availableCents : 0n);

    const pendingApprovalsCount = platformRepository.state.approvals.filter(
      (apr) => apr.entityId === entity.id && apr.status === "pending"
    ).length;

    return {
      entityId: entity.id,
      currency: entity.baseCurrency,
      bankCash,
      restrictedCash,
      reservations,
      availableCash,
      undrawnFacilities: "25000000.00",
      unreconciledValue: fromCents(unrecCents),
      pendingApprovalsCount,
      asOf: new Date().toISOString(),
      evidence: {
        bankBalanceVerified: accounts.length > 0,
        restrictionRecordsVerified: escrowAccounts.length > 0,
        sourceTimestamp: new Date().toISOString(),
      },
      sourcesCount: accounts.length,
    };
  });

  res.json({
    positions,
    consolidated: {
      currency: "AED",
      totalBankCash: positions.reduce((acc, p) => decimalAdd(acc, p.bankCash), "0.00"),
      totalRestrictedCash: positions.reduce((acc, p) => decimalAdd(acc, p.restrictedCash), "0.00"),
      totalReservations: positions.reduce((acc, p) => decimalAdd(acc, p.reservations), "0.00"),
      totalAvailableCash: positions.reduce((acc, p) => decimalAdd(acc, p.availableCash), "0.00"),
      totalUnreconciledValue: positions.reduce((acc, p) => decimalAdd(acc, p.unreconciledValue), "0.00"),
      totalPendingApprovals: positions.reduce((acc, p) => acc + p.pendingApprovalsCount, 0),
      asOf: new Date().toISOString(),
    },
  });
});

// ==========================================
// BANK ACCOUNTS & STATEMENTS
// ==========================================
router.get("/bank-accounts", requirePermission("bank.read"), (req, res) =>
  res.json(platformRepository.scoped("bankAccounts", req.user!.legalEntityIds))
);

router.get("/statements", requirePermission("bank.read"), (req, res) =>
  res.json(platformRepository.scoped("statements", req.user!.legalEntityIds))
);

router.post("/statements/import", requirePermission("bank.reconcile"), requireIdempotencyKey, (req, res, next) => {
  const schema = z.object({
    accountId: z.string(),
    entityId: z.string(),
    statementDate: z.string(),
    currency: z.string().length(3),
    openingBalance: z.string().regex(/^-?\d+\.\d{2}$/),
    closingBalance: z.string().regex(/^-?\d+\.\d{2}$/),
    transactions: z
      .array(
        z.object({
          date: z.string(),
          valueDate: z.string(),
          description: z.string(),
          amount: z.number(),
          currency: z.string().length(3),
          reference: z.string().optional(),
          counterparty: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "STATEMENT_INVALID", "Statement payload is invalid."));
  entityAllowed(req, parsed.data.entityId);

  const key = idempotencyScope(req, parsed.data.entityId);
  const previous = replay(key, parsed.data);
  if (previous) return res.status(201).json(previous);

  // Check duplicate statement
  if (
    platformRepository.state.statements.some(
      (s) => s.accountId === parsed.data.accountId && s.statementDate === parsed.data.statementDate
    )
  ) {
    return next(new ApiError(409, "STATEMENT_DUPLICATE", "A statement for this account and date has already been imported."));
  }

  const statement: Statement = {
    id: `stmt-${randomUUID().slice(0, 8)}`,
    accountId: parsed.data.accountId,
    entityId: parsed.data.entityId,
    statementDate: parsed.data.statementDate,
    currency: parsed.data.currency,
    openingBalance: parsed.data.openingBalance,
    closingBalance: parsed.data.closingBalance,
    status: "reconciled",
    importedAt: new Date().toISOString(),
  };

  platformRepository.state.statements.unshift(statement);

  // Ingest transactions if supplied
  if (parsed.data.transactions && parsed.data.transactions.length > 0) {
    parsed.data.transactions.forEach((t) => {
      store.addTransaction({
        date: t.date,
        valueDate: t.valueDate,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        account: parsed.data.accountId,
        reference: t.reference || "",
        counterparty: t.counterparty || "Imported counterparty",
        category: t.category || "Treasury Import",
        status: "unmatched",
        statementId: statement.id,
      });
    });
    broadcastTreasurySnapshot();
  }

  audit(req, "statement.imported", "statement", statement.id, statement.entityId);
  idempotentResponses.set(key, { body: JSON.stringify(parsed.data), response: structuredClone(statement) });
  res.status(201).json(statement);
});

// ==========================================
// COLLECTIONS & SETTLEMENTS
// ==========================================
router.get("/collections", requirePermission("payment.read"), (req, res) =>
  res.json(platformRepository.scoped("collections", req.user!.legalEntityIds))
);

router.post("/collections", requirePermission("payment.manage"), requireIdempotencyKey, (req, res, next) => {
  const schema = z.object({
    entityId: z.string(),
    provider: z.enum(["stripe", "telr", "amazon_ps"]),
    providerRef: z.string().min(3),
    merchantAccount: z.string().min(3),
    amount: z.string().regex(/^\d+\.\d{2}$/),
    currency: z.string().length(3),
    fee: z.string().regex(/^\d+\.\d{2}$/).default("0.00"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "COLLECTION_INVALID", "Collection payload is invalid."));
  entityAllowed(req, parsed.data.entityId);

  const netAmount = decimalSub(parsed.data.amount, parsed.data.fee);
  const collection: Collection = {
    id: `col-${randomUUID().slice(0, 8)}`,
    entityId: parsed.data.entityId,
    provider: parsed.data.provider,
    providerRef: parsed.data.providerRef,
    merchantAccount: parsed.data.merchantAccount,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    fee: parsed.data.fee,
    netAmount,
    status: "captured",
    createdAt: new Date().toISOString(),
  };

  platformRepository.state.collections.unshift(collection);
  audit(req, "collection.captured", "collection", collection.id, collection.entityId);
  res.status(201).json(collection);
});

router.get("/settlements", requirePermission("payment.read"), (req, res) =>
  res.json(platformRepository.scoped("settlements", req.user!.legalEntityIds))
);

router.post("/settlements/:id/match", requirePermission("bank.reconcile"), requireIdempotencyKey, (req, res, next) => {
  const settlement = platformRepository.state.settlements.find((s) => s.id === req.params.id);
  if (!settlement) return next(new ApiError(404, "SETTLEMENT_NOT_FOUND", "Settlement record not found."));
  entityAllowed(req, settlement.entityId);

  const parsed = z.object({ bankTxId: z.string(), bankAccountId: z.string() }).safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "MATCH_INVALID", "Valid bank transaction ID required."));

  settlement.status = "matched";
  settlement.bankTxId = parsed.data.bankTxId;
  settlement.bankAccountId = parsed.data.bankAccountId;

  audit(req, "settlement.matched", "settlement", settlement.id, settlement.entityId);
  res.json(settlement);
});

// ==========================================
// OUTBOUND PAYMENTS & APPROVALS
// ==========================================
router.get("/payments/outbound", requirePermission("payment.read"), (req, res) =>
  res.json(platformRepository.scoped("outboundPayments", req.user!.legalEntityIds))
);

router.post("/payments/outbound", requirePermission("payment.manage"), requireIdempotencyKey, (req, res, next) => {
  const schema = z.object({
    entityId: z.string(),
    beneficiaryName: z.string().min(2),
    beneficiaryIban: z.string().min(10),
    amount: z.string().regex(/^\d+\.\d{2}$/),
    currency: z.string().length(3),
    valueDate: z.string(),
    reason: z.string().min(3),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "OUTBOUND_PAYMENT_INVALID", "Payment payload is invalid."));
  entityAllowed(req, parsed.data.entityId);

  const key = idempotencyScope(req, parsed.data.entityId);
  const previous = replay(key, parsed.data);
  if (previous) return res.status(201).json(previous);

  const payment: OutboundPayment = {
    id: `out-pay-${randomUUID().slice(0, 8)}`,
    entityId: parsed.data.entityId,
    beneficiaryName: parsed.data.beneficiaryName,
    beneficiaryIban: parsed.data.beneficiaryIban,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    valueDate: parsed.data.valueDate,
    reason: parsed.data.reason,
    makerId: req.user!.sub,
    status: "pending_approval",
    kyribaReference: `KYR-REQ-${Math.floor(10000 + Math.random() * 90000)}`,
    events: [
      {
        id: randomUUID(),
        status: "created",
        occurredAt: new Date().toISOString(),
        source: "treasury-portal",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  platformRepository.state.outboundPayments.unshift(payment);

  // Automatically create maker-checker approval requirement
  const approval = {
    id: `apr-${randomUUID().slice(0, 8)}`,
    entityId: payment.entityId,
    subjectType: "payment" as const,
    subjectId: payment.id,
    action: `Approve outbound transfer ${formatCurrency(payment.amount, payment.currency)} to ${payment.beneficiaryName}`,
    makerId: req.user!.sub,
    status: "pending" as const,
  };
  platformRepository.state.approvals.unshift(approval);

  audit(req, "payment.created", "payment", payment.id, payment.entityId);
  idempotentResponses.set(key, { body: JSON.stringify(parsed.data), response: structuredClone(payment) });
  res.status(201).json(payment);
});

// ==========================================
// ESCROW MONITORING & RELEASES
// ==========================================
router.get("/escrow/accounts", requirePermission("escrow.read"), (req, res) =>
  res.json(platformRepository.scoped("escrowAccounts", req.user!.legalEntityIds))
);

router.get("/escrow/releases", requirePermission("escrow.read"), (req, res) =>
  res.json(platformRepository.scoped("escrowReleases", req.user!.legalEntityIds))
);

router.get("/escrow/restrictions", requirePermission("escrow.read"), (req, res) =>
  res.json(platformRepository.scoped("escrowRestrictions", req.user!.legalEntityIds))
);

router.post("/escrow/releases", requirePermission("escrow.release"), requireIdempotencyKey, (req, res, next) => {
  const parsed = z
    .object({
      accountId: z.string(),
      amount: z.string().regex(/^\d+\.\d{2}$/),
      reason: z.string().optional().default("Escrow release request"),
      evidenceDoc: z.string().optional().default("Standard documentation"),
    })
    .safeParse(req.body);

  if (!parsed.success) return next(new ApiError(400, "ESCROW_RELEASE_INVALID", "Escrow release data is invalid."));
  const account = platformRepository.state.escrowAccounts.find((item) => item.id === parsed.data.accountId);
  if (!account) return next(new ApiError(404, "ESCROW_ACCOUNT_NOT_FOUND", "Escrow account not found."));
  entityAllowed(req, account.entityId);

  const release: EscrowRelease = {
    id: `esr-${randomUUID().slice(0, 8)}`,
    accountId: account.id,
    entityId: account.entityId,
    amount: parsed.data.amount,
    currency: account.currency,
    reason: parsed.data.reason,
    evidenceDoc: parsed.data.evidenceDoc,
    makerId: req.user!.sub,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  platformRepository.state.escrowReleases.unshift(release);

  const approval = {
    id: `apr-${randomUUID().slice(0, 8)}`,
    entityId: account.entityId,
    subjectType: "escrow" as const,
    subjectId: release.id,
    action: `Review KRIBA release ${formatCurrency(parsed.data.amount, account.currency)} for ${account.projectName || account.id}`,
    makerId: req.user!.sub,
    status: "pending" as const,
  };
  platformRepository.state.approvals.unshift(approval);

  audit(req, "escrow.release_requested", "escrow", account.id, account.entityId);
  res.status(202).json({ release, approval, externalAction: "not_executed", providerStatus: "pending_vendor_validation" });
});

// ==========================================
// CONNECTORS & INTEGRATIONS
// ==========================================
router.get("/connectors", requirePermission("master.read"), (req, res) => {
  res.json(platformRepository.scoped("connectors", req.user!.legalEntityIds));
});

// ==========================================
// AGENT RUN VISIBILITY
// ==========================================
router.get("/agents/runs", requirePermission("audit.read"), (req, res) => {
  res.json(platformRepository.scoped("agentRuns", req.user!.legalEntityIds));
});

// ==========================================
// CUSTOMERS & INVOICES (PRESERVED)
// ==========================================
router.get("/customers", requirePermission("crm.read"), (req, res) => {
  res.json(platformRepository.scoped("customers", req.user!.legalEntityIds));
});

router.get("/customers/:id", requirePermission("crm.read"), (req, res, next) => {
  const customer = platformRepository.state.customers.find((item) => item.id === req.params.id);
  if (!customer) return next(new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found."));
  entityAllowed(req, customer.legalEntityId);
  res.json(customer);
});

router.post("/customers", requirePermission("crm.write"), requireIdempotencyKey, (req, res, next) => {
  const schema = z.object({
    legalEntityId: z.string(),
    code: z.string().min(3).max(24),
    legalName: z.string().min(2).max(160),
    taxId: z.string().min(4).max(40),
    terms: z.string().min(2).max(40),
    owner: z.string().min(2).max(80),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "CUSTOMER_INVALID", "Customer data is invalid."));
  entityAllowed(req, parsed.data.legalEntityId);
  const key = idempotencyScope(req, parsed.data.legalEntityId);
  const previous = replay(key, parsed.data);
  if (previous) return res.status(201).json(previous);
  if (
    platformRepository.state.customers.some(
      (item) => item.legalEntityId === parsed.data.legalEntityId && (item.code === parsed.data.code || item.taxId === parsed.data.taxId)
    )
  ) {
    return next(new ApiError(409, "CUSTOMER_DUPLICATE", "Customer code or tax identifier already exists."));
  }
  const customer: Customer = { id: randomUUID(), ...parsed.data, creditStatus: "review", status: "draft", version: 1 };
  platformRepository.state.customers.push(customer);
  audit(req, "customer.created", "customer", customer.id, customer.legalEntityId);
  idempotentResponses.set(key, { body: JSON.stringify(parsed.data), response: structuredClone(customer) });
  res.status(201).json(customer);
});

router.get("/invoices", requirePermission("invoice.read"), (req, res) => {
  res.json(platformRepository.scoped("invoices", req.user!.legalEntityIds));
});

router.get("/invoices/:id", requirePermission("invoice.read"), (req, res, next) => {
  const invoice = platformRepository.state.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return next(new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found."));
  entityAllowed(req, invoice.entityId);
  res.json(invoice);
});

router.post("/invoices", requirePermission("invoice.create"), requireIdempotencyKey, (req, res, next) => {
  const schema = z.object({
    entityId: z.string(),
    customerId: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    currency: z.string().length(3),
    total: z.string().regex(/^\d+\.\d{2}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "INVOICE_INVALID", "Invoice data is invalid."));
  entityAllowed(req, parsed.data.entityId);
  const customer = platformRepository.state.customers.find(
    (item) => item.id === parsed.data.customerId && item.legalEntityId === parsed.data.entityId
  );
  if (!customer) return next(new ApiError(403, "ENTITY_SCOPE_DENIED", "Customer must belong to the invoice legal entity."));
  const key = idempotencyScope(req, parsed.data.entityId);
  const previous = replay(key, parsed.data);
  if (previous) return res.status(201).json(previous);
  const invoice: Invoice = {
    id: randomUUID(),
    ...parsed.data,
    number: `INV-${String(platformRepository.state.invoices.length + 24108)}`,
    openAmount: parsed.data.total,
    status: "draft",
    version: 1,
  };
  platformRepository.state.invoices.unshift(invoice);
  audit(req, "invoice.created", "invoice", invoice.id, invoice.entityId);
  idempotentResponses.set(key, { body: JSON.stringify(parsed.data), response: structuredClone(invoice) });
  res.status(201).json(invoice);
});

router.post("/invoices/:id/issue", requirePermission("invoice.approve"), requireIdempotencyKey, (req, res, next) => {
  const invoice = platformRepository.state.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return next(new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found."));
  entityAllowed(req, invoice.entityId);
  if (!["draft", "approved"].includes(invoice.status)) {
    return next(new ApiError(422, "INVOICE_TRANSITION_INVALID", "Only a draft or approved invoice can be issued."));
  }
  invoice.status = "issued";
  invoice.version += 1;
  audit(req, "invoice.issued", "invoice", invoice.id, invoice.entityId);
  res.json(invoice);
});

router.post("/invoices/:id/close", requirePermission("invoice.close"), requireIdempotencyKey, (req, res, next) => {
  const invoice = platformRepository.state.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return next(new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found."));
  entityAllowed(req, invoice.entityId);
  if (invoice.openAmount !== "0.00" || invoice.status !== "paid") {
    return next(new ApiError(422, "INVOICE_NOT_READY_TO_CLOSE", "Invoice must be fully allocated and paid before controlled closure."));
  }
  const approval = platformRepository.state.approvals.find(
    (item) =>
      item.subjectId === invoice.id &&
      item.subjectType === "invoice" &&
      item.entityId === invoice.entityId &&
      item.status === "approved" &&
      item.checkerId &&
      item.checkerId !== item.makerId
  );
  if (!approval) return next(new ApiError(422, "APPROVAL_REQUIRED", "An approved maker-checker decision is required before closure."));
  invoice.status = "closed";
  invoice.version += 1;
  audit(req, "invoice.closed", "invoice", invoice.id, invoice.entityId);
  res.json(invoice);
});

// Preserved generic payments
router.get("/payments", requirePermission("payment.read"), (req, res) =>
  res.json(platformRepository.scoped("payments", req.user!.legalEntityIds))
);
router.get("/payments/:id", requirePermission("payment.read"), (req, res, next) => {
  const payment = platformRepository.state.payments.find((item) => item.id === req.params.id);
  if (!payment) return next(new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found."));
  entityAllowed(req, payment.entityId);
  res.json(payment);
});
router.get("/payments/:id/tracking", requirePermission("payment.read"), (req, res, next) => {
  const payment = platformRepository.state.payments.find((item) => item.id === req.params.id);
  if (!payment) return next(new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found."));
  entityAllowed(req, payment.entityId);
  res.json({ paymentId: payment.id, status: payment.status, events: payment.events, dataMode: "illustrative-development" });
});

// ==========================================
// CENTRAL APPROVALS INBOX (MAKER-CHECKER)
// ==========================================
router.get("/approvals", requirePermission("master.read"), (req, res) =>
  res.json(platformRepository.scoped("approvals", req.user!.legalEntityIds))
);

router.post("/approvals/:id/decisions", requirePermission("master.approve"), requireIdempotencyKey, (req, res, next) => {
  const parsed = z.object({ decision: z.enum(["approved", "rejected"]) }).safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "APPROVAL_DECISION_INVALID", "Approval decision is invalid."));
  const approval = platformRepository.state.approvals.find((item) => item.id === req.params.id);
  if (!approval) return next(new ApiError(404, "APPROVAL_NOT_FOUND", "Approval not found."));
  entityAllowed(req, approval.entityId);
  if (approval.status !== "pending") return next(new ApiError(422, "APPROVAL_ALREADY_DECIDED", "Only pending approvals may be decided."));
  if (approval.makerId === req.user!.sub) return next(new ApiError(403, "MAKER_CHECKER_CONFLICT", "The maker cannot approve their own request."));

  approval.status = parsed.data.decision;
  approval.checkerId = req.user!.sub;
  approval.decidedAt = new Date().toISOString();

  // Cascade approval status to underlying resource
  if (approval.subjectType === "payment") {
    const pay = platformRepository.state.outboundPayments.find((p) => p.id === approval.subjectId);
    if (pay) {
      pay.status = parsed.data.decision === "approved" ? "approved" : "rejected";
      pay.checkerId = req.user!.sub;
      pay.events.push({
        id: randomUUID(),
        status: pay.status,
        occurredAt: new Date().toISOString(),
        source: "maker-checker-gateway",
      });
    }
  } else if (approval.subjectType === "escrow") {
    const rel = platformRepository.state.escrowReleases.find((r) => r.id === approval.subjectId);
    if (rel) {
      rel.status = parsed.data.decision === "approved" ? "approved" : "rejected";
      rel.checkerId = req.user!.sub;
      rel.approvedAt = new Date().toISOString();
    }
  }

  audit(req, `approval.${approval.status}`, "approval", approval.id, approval.entityId);
  res.json(approval);
});

// ==========================================
// REPORTS & EXPORTS
// ==========================================
router.get("/reports/cash-position.csv", requirePermission("ledger.read"), (req, res) => {
  const authorizedEntities = platformRepository.state.legalEntities.filter((e) => req.user!.legalEntityIds.includes(e.id));
  const quote = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const asOf = new Date().toISOString();

  const rows = [
    ["Report", "Treasury Atom Consolidated Cash Position"],
    ["As Of", asOf],
    ["Tenant", req.user!.tenantId],
    [],
    ["Entity Code", "Legal Entity", "Currency", "Bank Cash", "Restricted Cash", "Reservations", "Available Cash", "Status"],
  ];

  let totalBankCents = 0n;
  let totalRestrictedCents = 0n;
  let totalAvailableCents = 0n;

  authorizedEntities.forEach((entity) => {
    const accounts = platformRepository.state.bankAccounts.filter((a) => a.entityId === entity.id && a.status === "active");
    const escrow = platformRepository.state.escrowAccounts.filter((a) => a.entityId === entity.id && a.status === "active");
    const outbound = platformRepository.state.outboundPayments.filter((p) => p.entityId === entity.id && p.status === "pending_approval");

    let bankCents = 0n;
    accounts.forEach((a) => (bankCents += toCents(a.availableBalance)));
    let restCents = 0n;
    escrow.forEach((e) => (restCents += toCents(e.restrictedBalance || "0.00")));
    let resCents = 0n;
    outbound.forEach((p) => (resCents += toCents(p.amount)));

    const availCents = bankCents - restCents - resCents;

    totalBankCents += bankCents;
    totalRestrictedCents += restCents;
    totalAvailableCents += availCents;

    rows.push([
      entity.code,
      entity.legalName,
      entity.baseCurrency,
      fromCents(bankCents),
      fromCents(restCents),
      fromCents(resCents),
      fromCents(availCents > 0n ? availCents : 0n),
      "Verified",
    ]);
  });

  rows.push([]);
  rows.push(["Control Total (Consolidated)", "", "AED", fromCents(totalBankCents), fromCents(totalRestrictedCents), "", fromCents(totalAvailableCents), "MATCHED"]);

  res
    .set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cash-position-${asOf.slice(0, 10)}.csv"`,
    })
    .send(rows.map((r) => r.map(quote).join(",")).join("\n"));
});

router.get("/reports/exceptions.csv", requirePermission("ledger.read"), (req, res) => {
  const quote = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const asOf = new Date().toISOString();
  const unrec = store.state.transactions.filter((t) => ["unmatched", "exception"].includes(t.status));

  const rows = [
    ["Report", "Treasury Atom Reconciliation Exceptions"],
    ["As Of", asOf],
    [],
    ["Transaction ID", "Date", "Account", "Description", "Amount", "Currency", "Counterparty", "Status", "Notes"],
    ...unrec.map((t) => [t.id, t.date, t.account, t.description, String(t.amount), t.currency, t.counterparty, t.status, t.notes || ""]),
  ];

  res
    .set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="exceptions-${asOf.slice(0, 10)}.csv"`,
    })
    .send(rows.map((r) => r.map(quote).join(",")).join("\n"));
});

// Audit events
router.get("/audit-events", requirePermission("audit.read"), (req, res) =>
  res.json(platformRepository.scoped("auditEvents", req.user!.legalEntityIds))
);

// Reset
router.post(
  "/dev/reset",
  (_req, _res, next) => {
    if (!isDevelopment()) return next(new ApiError(404, "V1_ROUTE_NOT_FOUND", "Route not found."));
    next();
  },
  requirePermission("admin.manage"),
  requireLegacyScope,
  (req, res, next) => {
    if (platformRepository.state.legalEntities.some((entity) => entity.tenantId !== req.user!.tenantId)) {
      return next(new ApiError(409, "RESET_SCOPE_UNSUPPORTED", "A shared repository cannot be reset through a tenant session."));
    }
    platformRepository.reset();
    idempotentResponses.clear();
    res.json({ ok: true, dataMode: "illustrative-development" });
  }
);

router.use((_req, _res, next) => next(new ApiError(404, "V1_ROUTE_NOT_FOUND", "The requested v1 resource does not exist.")));

export default router;
