import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import { store } from "./store/memoryStore.js";
import {
  reconciliationSummary,
  suggestMatches,
} from "./services/reconciliation.js";
import { startLogin, verifyOtp } from "./services/auth.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { authenticateToken, legacyScopeAllowed, requireAdmin, requireLegacyScope, requireMembership } from "./middleware/auth.js";
import treasuryStreamRouter, {
  broadcastTreasurySnapshot,
} from "./routes/treasuryStream.js";
import { buildTreasurySnapshot } from "./services/treasuryService.js";
import { requestContext, requirePermission } from "./middleware/requestContext.js";
import { runtimeConfig } from "./config.js";
import { ApiError } from "./shared/errors/apiError.js";
import platformRouter from "./modules/platform/router.js";

const txSchema = z.object({
  date: z.string().min(8),
  valueDate: z.string().min(8),
  description: z.string().min(2),
  amount: z.number(),
  currency: z.string().length(3),
  account: z.string().min(2),
  reference: z.string().default(""),
  status: z
    .enum(["unmatched", "suggested", "matched", "exception"])
    .default("unmatched"),
  counterparty: z.string().default("Unknown"),
  category: z.string().default("Uncategorized"),
  statementId: z.string().default("manual"),
  matchedJournalId: z.string().optional(),
  notes: z.string().optional(),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const emit = (_type: string, _payload: unknown) => {};

export function createApp() {
  const config = runtimeConfig();
  const app = express();
  app.use(requestContext);
  app.use(cors({ origin(origin, callback) {
    if (!origin || config.origins.includes(origin)) return callback(null, true);
    callback(new ApiError(403, "ORIGIN_DENIED", "Browser origin is not allowed."));
  }, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Correlation-Id', 'Last-Event-ID'] }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      service: "agentic-treasury-api",
      time: new Date().toISOString(),
    }),
  );
  app.get("/api/health/runtime", (_req, res) => {
    const checkedAt = new Date().toISOString();
    res.status(config.development ? 200 : 503).json({
      status: config.development ? "propose_only" : "not_configured",
      canMutate: false,
      checkedAt,
      layers: {
        process: { status: "healthy", checkedAt },
        scheduler: { status: "not_configured", checkedAt },
        execution: { status: config.development ? "healthy" : "not_configured", checkedAt, mode: config.development ? "in_memory_development" : "disabled" },
        governance: { status: "propose_only", checkedAt, reason: "No production verifier or durable approval token store is configured" },
      },
    });
  });
  // No production identity or durable repository adapter exists yet. Health is
  // observable, but no development identity, data, mutation or stream is served.
  if (!config.development) {
    app.use('/api', (req, res) => {
      const developmentRoute = ['/auth/signup', '/seed', '/v1/dev/reset'].includes(req.path);
      res.status(developmentRoute ? 404 : 503).json({ error: {
        code: developmentRoute ? 'ROUTE_NOT_FOUND' : 'PRODUCTION_NOT_CONFIGURED',
        message: developmentRoute ? 'Route not found.' : 'Production identity and persistence are not configured.',
        correlationId: req.correlationId,
      } });
    });
  }
  if (config.development) {
  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: "Valid email and password are required" });
    const result = await startLogin(parsed.data.email, parsed.data.password);
    if (!result) return res.status(401).json({ error: "Invalid credentials" });
    res.json({
      ...result,
      message: "Development OTP generated. No email was sent.",
    });
  });
  app.post("/api/auth/signup", async (req, res) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(10),
        name: z.string().min(2),
      })
      .safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          error: "Name, valid email and 10-character password required",
        });
    if (
      store.state.users.some(
        (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase(),
      )
    )
      return res.status(409).json({ error: "Account already exists" });
    const user = {
      id: randomUUID(),
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: "treasury" as const,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      onboarded: false,
    };
    store.state.users.push(user);
    res
      .status(201)
      .json({
        id: user.id,
        email: user.email,
        role: user.role,
        message:
          "Development account created. Continue through the local OTP login.",
      });
  });
  app.post("/api/auth/verify-otp", (req, res) => {
    const parsed = z
      .object({ challengeId: z.string(), otp: z.string().length(6) })
      .safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Six-digit OTP required" });
    const result = verifyOtp(parsed.data.challengeId, parsed.data.otp);
    if (!result)
      return res.status(401).json({ error: "Invalid or expired OTP" });
    res.json(result);
  });
  }
  if (config.development) {
  app.use(treasuryStreamRouter);
  app.use("/api", authenticateToken);
  app.use("/api/v1", requireMembership, platformRouter);
  app.get("/api/me", (req, res) => {
    const u = store.state.users.find((x) => x.id === req.user!.sub)!;
    res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      role: req.user!.role,
      tenantId: req.user!.tenantId,
      onboarded: u.onboarded,
      permissions: req.user!.permissions,
      legalEntityIds: req.user!.legalEntityIds,
    });
  });
  app.patch("/api/onboarding", (req, res) => {
    const u = store.state.users.find((x) => x.id === req.user!.sub)!;
    u.name = String(req.body.name || u.name);
    u.onboarded = true;
    if (legacyScopeAllowed(req.user!)) store.audit(u.email, "onboarding.complete", "user", u.id);
    res.json({ ok: true });
  });
  app.use('/api', requireMembership, requireLegacyScope, (req, res, next) => {
    const permission = req.path === '/audit' ? 'audit.read'
      : req.path.startsWith('/ledger') || req.path.startsWith('/reports') ? 'ledger.read'
      : req.method === 'GET' ? 'bank.read' : 'bank.reconcile';
    requirePermission(permission)(req, res, next);
  });
  app.get('/api/dashboard', requirePermission('ledger.read'), requirePermission('audit.read'));
  app.get("/api/dashboard", (_req, res) => {
    const s = store.state;
    res.json({
      ...buildTreasurySnapshot(),
      unapplied: {
        count: s.unapplied.filter((x) => x.status !== "applied").length,
        total: s.unapplied
          .filter((x) => x.status !== "applied")
          .reduce((n, x) => n + x.amount, 0),
      },
      statements: s.statements,
      agentTasks: s.agentTasks,
      audit: s.audit.slice(0, 8),
    });
  });
  app.get("/api/transactions", (req, res) => {
    const q = String(req.query.q || "").toLowerCase(),
      status = String(req.query.status || "all");
    res.json(
      store.state.transactions.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (!q ||
            [t.description, t.reference, t.account, t.counterparty].some((v) =>
              v.toLowerCase().includes(q),
            )),
      ),
    );
  });
  app.post("/api/transactions", (req, res) => {
    const p = txSchema.safeParse(req.body);
    if (!p.success)
      return res
        .status(400)
        .json({ error: "Invalid transaction", issues: p.error.issues });
    const tx = store.addTransaction(p.data);
    store.audit(req.user!.email, "transaction.create", "transaction", tx.id);
    emit("transaction.changed", { action: "created", id: tx.id });
    broadcastTreasurySnapshot();
    res.status(201).json(tx);
  });
  app.patch("/api/transactions/:id", (req, res) => {
    const current = store.state.transactions.find(
      (t) => t.id === req.params.id,
    );
    if (!current)
      return res.status(404).json({ error: "Transaction not found" });
    const p = txSchema.partial().safeParse(req.body);
    if (!p.success)
      return res.status(400).json({ error: "Invalid transaction update" });
    const tx = store.updateTransaction(req.params.id, p.data);
    store.audit(
      req.user!.email,
      "transaction.update",
      "transaction",
      req.params.id,
    );
    emit("transaction.changed", { action: "updated", id: req.params.id });
    broadcastTreasurySnapshot();
    res.json(tx);
  });
  app.delete("/api/transactions/:id", requireAdmin, (req, res) => {
    const id = String(req.params.id);
    if (!store.deleteTransaction(id))
      return res.status(404).json({ error: "Transaction not found" });
    store.audit(req.user!.email, "transaction.delete", "transaction", id);
    emit("transaction.changed", { action: "deleted", id });
    broadcastTreasurySnapshot();
    res.status(204).send();
  });
  app.get("/api/reconciliation/suggestions/:id", (req, res) => {
    const tx = store.state.transactions.find((t) => t.id === req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(
      suggestMatches(tx, store.state.journals).map((s) => ({
        ...s,
        journal: store.state.journals.find((j) => j.id === s.journalId),
      })),
    );
  });
  app.post("/api/reconciliation/:id", (req, res) => {
    const p = z
      .object({
        decision: z.enum(["matched", "unmatched", "exception"]),
        journalId: z.string().optional(),
        note: z.string().max(500).optional(),
      })
      .safeParse(req.body);
    if (!p.success)
      return res.status(400).json({ error: "Invalid reconciliation decision" });
    const patch: any = { status: p.data.decision, notes: p.data.note };
    if (p.data.decision === "matched") {
      if (
        !p.data.journalId ||
        !store.state.journals.some((j) => j.id === p.data.journalId)
      )
        return res
          .status(400)
          .json({ error: "Valid journalId required for a match" });
      patch.matchedJournalId = p.data.journalId;
    } else patch.matchedJournalId = undefined;
    const tx = store.updateTransaction(req.params.id, patch);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    store.audit(
      req.user!.email,
      `reconciliation.${p.data.decision}`,
      "transaction",
      tx.id,
    );
    emit("reconciliation.changed", { id: tx.id, status: tx.status });
    broadcastTreasurySnapshot();
    res.json(tx);
  });
  app.get("/api/unapplied-cash", (_req, res) =>
    res.json(store.state.unapplied),
  );
  app.post("/api/unapplied-cash", (req, res) => {
    const p = z
      .object({
        transactionId: z.string(),
        payer: z.string(),
        amount: z.number().positive(),
        currency: z.string().length(3),
        receivedDate: z.string(),
        ageDays: z.number().int().nonnegative(),
        reason: z.string(),
        status: z.enum(["open", "investigating", "applied"]),
        owner: z.string(),
      })
      .safeParse(req.body);
    if (!p.success)
      return res.status(400).json({ error: "Invalid unapplied cash item" });
    const item = store.addUnapplied(p.data);
    store.audit(req.user!.email, "unapplied.create", "unapplied", item.id);
    res.status(201).json(item);
  });
  app.patch("/api/unapplied-cash/:id", (req, res) => {
    const item = store.state.unapplied.find((x) => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    Object.assign(item, req.body, { id: item.id });
    store.audit(req.user!.email, "unapplied.update", "unapplied", item.id);
    res.json(item);
  });
  app.get("/api/ledger", (_req, res) =>
    res.json({
      transactions: store.state.transactions,
      journals: store.state.journals,
      summary: reconciliationSummary(store.state.transactions),
    }),
  );
  app.get("/api/statements", (_req, res) => res.json(store.state.statements));
  app.get("/api/audit", (_req, res) => res.json(store.state.audit));
  if (config.development) app.post("/api/seed", requireAdmin, (req, res) => {
    store.resetTreasuryData();
    store.audit(
      req.user!.email,
      "seed.reset",
      "workspace",
      "Mock dataset reset",
    );
    emit("workspace.seeded", { at: new Date().toISOString() });
    broadcastTreasurySnapshot();
    res.json({ ok: true });
  });
  app.get("/api/reports/transactions.csv", (_req, res) => {
    const quote = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Date",
        "Value date",
        "Description",
        "Amount",
        "Currency",
        "Account",
        "Reference",
        "Status",
        "Counterparty",
      ],
      ...store.state.transactions.map((t) => [
        t.date,
        t.valueDate,
        t.description,
        t.amount,
        t.currency,
        t.account,
        t.reference,
        t.status,
        t.counterparty,
      ]),
    ];
    res
      .set({
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="treasury-transactions.csv"',
      })
      .send(rows.map((r) => r.map(quote).join(",")).join("\n"));
  });
  }
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          correlationId: req.correlationId,
          ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        },
      });
    }
    console.error(err);
    res.status(500).json({
      error: req.path.startsWith("/api/v1")
        ? { code: "INTERNAL_ERROR", message: "Unexpected server error", correlationId: req.correlationId }
        : "Unexpected server error",
    });
  });
  return app;
}
