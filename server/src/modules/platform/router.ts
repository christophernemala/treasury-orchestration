import { randomUUID } from "node:crypto";
import { Router, type Request } from "express";
import { z } from "zod";
import { type Permission } from "../access/policy.js";
import { requireIdempotencyKey, requirePermission } from "../../middleware/requestContext.js";
import { ApiError } from "../../shared/errors/apiError.js";
import { platformRepository } from "./memoryRepository.js";
import type { Customer, Invoice, PlatformAuditEvent } from "./types.js";

const router = Router();
const idempotentResponses = new Map<string, unknown>();

const modules: Array<{ id: string; label: string; permission: Permission; status: string }> = [
  { id: "crm", label: "CRM", permission: "crm.read", status: "available" },
  { id: "invoices", label: "Invoicing", permission: "invoice.read", status: "available" },
  { id: "banking", label: "Banking", permission: "bank.read", status: "available" },
  { id: "reconciliation", label: "Reconciliation", permission: "bank.reconcile", status: "available" },
  { id: "payments", label: "Payments", permission: "payment.read", status: "available" },
  { id: "escrow", label: "KRIBA Escrow", permission: "escrow.read", status: "pending_vendor_configuration" },
  { id: "ledger", label: "Ledger", permission: "ledger.read", status: "available" },
  { id: "entities", label: "Master data", permission: "master.read", status: "available" },
  { id: "approvals", label: "Approvals", permission: "master.read", status: "available" },
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

function idempotencyScope(req: Request) {
  return `${req.user!.sub}:${req.path}:${String(req.headers["idempotency-key"])}`;
}

function entityAllowed(req: Request, entityId: string) {
  if (!req.user!.legalEntityIds.includes(entityId)) {
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
  const key = idempotencyScope(req);
  if (idempotentResponses.has(key)) return res.status(201).json(idempotentResponses.get(key));
  if (platformRepository.state.customers.some((item) => item.legalEntityId === parsed.data.legalEntityId && (item.code === parsed.data.code || item.taxId === parsed.data.taxId))) {
    return next(new ApiError(409, "CUSTOMER_DUPLICATE", "Customer code or tax identifier already exists."));
  }
  const customer: Customer = { id: randomUUID(), ...parsed.data, creditStatus: "review", status: "draft", version: 1 };
  platformRepository.state.customers.push(customer);
  audit(req, "customer.created", "customer", customer.id, customer.legalEntityId);
  idempotentResponses.set(key, customer);
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
    entityId: z.string(), customerId: z.string(), issueDate: z.string(), dueDate: z.string(), currency: z.string().length(3), total: z.string().regex(/^\d+\.\d{2}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "INVOICE_INVALID", "Invoice data is invalid."));
  entityAllowed(req, parsed.data.entityId);
  const key = idempotencyScope(req);
  if (idempotentResponses.has(key)) return res.status(201).json(idempotentResponses.get(key));
  const invoice: Invoice = {
    id: randomUUID(), ...parsed.data, number: `INV-${String(platformRepository.state.invoices.length + 24108)}`, openAmount: parsed.data.total, status: "draft", version: 1,
  };
  platformRepository.state.invoices.unshift(invoice);
  audit(req, "invoice.created", "invoice", invoice.id, invoice.entityId);
  idempotentResponses.set(key, invoice);
  res.status(201).json(invoice);
});

router.post("/invoices/:id/issue", requirePermission("invoice.approve"), requireIdempotencyKey, (req, res, next) => {
  const invoice = platformRepository.state.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return next(new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found."));
  entityAllowed(req, invoice.entityId);
  if (!['draft', 'approved'].includes(invoice.status)) return next(new ApiError(422, "INVOICE_TRANSITION_INVALID", "Only a draft or approved invoice can be issued."));
  invoice.status = "issued";
  invoice.version += 1;
  audit(req, "invoice.issued", "invoice", invoice.id, invoice.entityId);
  res.json(invoice);
});

router.post("/invoices/:id/close", requirePermission("invoice.close"), requireIdempotencyKey, (req, res, next) => {
  const invoice = platformRepository.state.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return next(new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found."));
  entityAllowed(req, invoice.entityId);
  if (invoice.openAmount !== "0.00" || invoice.status !== "paid") return next(new ApiError(422, "INVOICE_NOT_READY_TO_CLOSE", "Invoice must be fully allocated and paid before controlled closure."));
  const approval = platformRepository.state.approvals.find((item) => item.subjectId === invoice.id && item.status === "approved");
  if (!approval) return next(new ApiError(422, "APPROVAL_REQUIRED", "An approved maker-checker decision is required before closure."));
  invoice.status = "closed";
  invoice.version += 1;
  audit(req, "invoice.closed", "invoice", invoice.id, invoice.entityId);
  res.json(invoice);
});

router.get("/bank-accounts", requirePermission("bank.read"), (req, res) => res.json(platformRepository.scoped("bankAccounts", req.user!.legalEntityIds)));
router.get("/payments", requirePermission("payment.read"), (req, res) => res.json(platformRepository.scoped("payments", req.user!.legalEntityIds)));
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

router.get("/escrow/accounts", requirePermission("escrow.read"), (req, res) => res.json(platformRepository.scoped("escrowAccounts", req.user!.legalEntityIds)));
router.post("/escrow/releases", requirePermission("escrow.release"), requireIdempotencyKey, (req, res, next) => {
  const parsed = z.object({ accountId: z.string(), amount: z.string().regex(/^\d+\.\d{2}$/) }).safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "ESCROW_RELEASE_INVALID", "Escrow release data is invalid."));
  const account = platformRepository.state.escrowAccounts.find((item) => item.id === parsed.data.accountId);
  if (!account) return next(new ApiError(404, "ESCROW_ACCOUNT_NOT_FOUND", "Escrow account not found."));
  entityAllowed(req, account.entityId);
  const approval = { id: randomUUID(), entityId: account.entityId, subjectType: "escrow" as const, subjectId: account.id, action: `Review mock KRIBA release ${parsed.data.amount} ${account.currency}`, makerId: req.user!.sub, status: "pending" as const };
  platformRepository.state.approvals.unshift(approval);
  audit(req, "escrow.release_requested", "escrow", account.id, account.entityId);
  res.status(202).json({ approval, externalAction: "not_executed", providerStatus: "pending_vendor_validation" });
});

router.get("/approvals", requirePermission("master.read"), (req, res) => res.json(platformRepository.scoped("approvals", req.user!.legalEntityIds)));
router.post("/approvals/:id/decisions", requirePermission("master.approve"), requireIdempotencyKey, (req, res, next) => {
  const parsed = z.object({ decision: z.enum(["approved", "rejected"]) }).safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, "APPROVAL_DECISION_INVALID", "Approval decision is invalid."));
  const approval = platformRepository.state.approvals.find((item) => item.id === req.params.id);
  if (!approval) return next(new ApiError(404, "APPROVAL_NOT_FOUND", "Approval not found."));
  entityAllowed(req, approval.entityId);
  if (approval.makerId === req.user!.sub) return next(new ApiError(403, "MAKER_CHECKER_CONFLICT", "The maker cannot approve their own request."));
  approval.status = parsed.data.decision;
  approval.checkerId = req.user!.sub;
  approval.decidedAt = new Date().toISOString();
  audit(req, `approval.${approval.status}`, "approval", approval.id, approval.entityId);
  res.json(approval);
});

router.get("/audit-events", requirePermission("audit.read"), (req, res) => res.json(platformRepository.scoped("auditEvents", req.user!.legalEntityIds)));
router.post("/dev/reset", requirePermission("admin.manage"), (_req, res) => {
  platformRepository.reset();
  idempotentResponses.clear();
  res.json({ ok: true, dataMode: "illustrative-development" });
});

router.use((_req, _res, next) => next(new ApiError(404, "V1_ROUTE_NOT_FOUND", "The requested v1 resource does not exist.")));

export default router;
