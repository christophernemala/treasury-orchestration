import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { platformRepository } from "../src/modules/platform/memoryRepository.js";

async function authenticate(email: string, password = "Treasury123!") {
  const app = createApp();
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const verify = await request(app).post("/api/auth/verify-otp").send({ challengeId: login.body.challengeId, otp: login.body.devOtp });
  return { app, token: verify.body.token as string };
}

describe("platform v1 controls", () => {
  beforeEach(() => platformRepository.reset());

  it("returns scoped modules and a correlation identifier", async () => {
    const session = await authenticate("analyst@treasury.local");
    const response = await request(session.app).get("/api/v1/modules").set("Authorization", `Bearer ${session.token}`);
    expect(response.status).toBe(200);
    expect(response.headers["x-correlation-id"]).toBeTruthy();
    expect(response.body.dataMode).toBe("illustrative-development");
    expect(response.body.permissions).toContain("bank.reconcile");
    expect(response.body.permissions).not.toContain("admin.manage");
  });

  it("enforces permission and structured error contracts", async () => {
    const session = await authenticate("analyst@treasury.local");
    const response = await request(session.app).post("/api/v1/customers").set("Authorization", `Bearer ${session.token}`).set("Idempotency-Key", "customer-1").send({});
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("PERMISSION_DENIED");
    expect(response.body.error.correlationId).toBeTruthy();
  });

  it("requires and replays idempotent writes", async () => {
    const session = await authenticate("admin@treasury.local");
    const body = { legalEntityId: "le-northstar-ae", code: "CUS-990", legalName: "Illustrative Trading LLC", taxId: "100099990000001", terms: "Net 30", owner: "Amina Rahman" };
    const missing = await request(session.app).post("/api/v1/customers").set("Authorization", `Bearer ${session.token}`).send(body);
    expect(missing.status).toBe(400);
    const first = await request(session.app).post("/api/v1/customers").set("Authorization", `Bearer ${session.token}`).set("Idempotency-Key", "customer-990").send(body);
    const replay = await request(session.app).post("/api/v1/customers").set("Authorization", `Bearer ${session.token}`).set("Idempotency-Key", "customer-990").send(body);
    expect(first.status).toBe(201);
    expect(replay.body.id).toBe(first.body.id);
  });

  it("creates an approval without executing an escrow release", async () => {
    const session = await authenticate("admin@treasury.local");
    const response = await request(session.app).post("/api/v1/escrow/releases").set("Authorization", `Bearer ${session.token}`).set("Idempotency-Key", "release-1").send({ accountId: "esc-kriba-aed", amount: "5000.00" });
    expect(response.status).toBe(202);
    expect(response.body.externalAction).toBe("not_executed");
    expect(response.body.approval.status).toBe("pending");
  });
});
