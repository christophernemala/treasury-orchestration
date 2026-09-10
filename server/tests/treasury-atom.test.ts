import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { store } from "../src/store/memoryStore.js";
import { platformRepository } from "../src/modules/platform/memoryRepository.js";

async function authenticate(email = "admin@treasury.local") {
  const app = createApp();
  const login = await request(app).post("/api/auth/login").send({ email, password: "Treasury123!" });
  const otp = await request(app).post("/api/auth/verify-otp").send({ challengeId: login.body.challengeId, otp: login.body.devOtp });
  return { app, token: otp.body.token };
}

describe("Treasury Atom Operations & Workflows", () => {
  beforeEach(() => {
    store.reset();
    platformRepository.reset();
  });

  it("calculates exact cash position and segregates restricted cash without double counting", async () => {
    const session = await authenticate();
    const res = await request(session.app)
      .get("/api/v1/cash-positions")
      .set("Authorization", `Bearer ${session.token}`);

    expect(res.status).toBe(200);
    expect(res.body.positions).toHaveLength(2);
    
    // Find Northstar UAE (AED)
    const aePos = res.body.positions.find((p: any) => p.entityId === "le-northstar-ae");
    expect(aePos).toBeTruthy();
    expect(aePos.currency).toBe("AED");
    // Available cash must equal bank cash minus restricted cash minus reservations
    expect(aePos.bankCash).toBe("17492750.00");
    expect(aePos.restrictedCash).toBe("3500000.00");
    expect(aePos.reservations).toBe("450000.00");
    expect(aePos.availableCash).toBe("13542750.00");
    expect(aePos.evidence.bankBalanceVerified).toBe(true);
    expect(aePos.evidence.restrictionRecordsVerified).toBe(true);
  });

  it("imports bank statements and prevents duplicate statement ingestion", async () => {
    const session = await authenticate();
    const payload = {
      accountId: "ba-aed-4921",
      entityId: "le-northstar-ae",
      statementDate: "2026-09-08",
      currency: "AED",
      openingBalance: "12642750.00",
      closingBalance: "12800000.00",
      transactions: [
        {
          date: "2026-09-08",
          valueDate: "2026-09-08",
          description: "Customer Inbound Wire Clearing",
          amount: 157250,
          currency: "AED",
          reference: "WIRE-IN-0908",
        },
      ],
    };

    const first = await request(session.app)
      .post("/api/v1/statements/import")
      .set("Authorization", `Bearer ${session.token}`)
      .set("Idempotency-Key", "import-stmt-0908")
      .send(payload);

    expect(first.status).toBe(201);
    expect(first.body.statementDate).toBe("2026-09-08");

    // Replay idempotency
    const replay = await request(session.app)
      .post("/api/v1/statements/import")
      .set("Authorization", `Bearer ${session.token}`)
      .set("Idempotency-Key", "import-stmt-0908")
      .send(payload);
    expect(replay.status).toBe(201);
    expect(replay.body.id).toBe(first.body.id);

    // Duplicate detection with different key
    const duplicate = await request(session.app)
      .post("/api/v1/statements/import")
      .set("Authorization", `Bearer ${session.token}`)
      .set("Idempotency-Key", "import-stmt-0908-diff")
      .send(payload);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("STATEMENT_DUPLICATE");
  });

  it("enforces maker-checker dual control on outbound payments", async () => {
    const session = await authenticate();
    const payPayload = {
      entityId: "le-northstar-ae",
      beneficiaryName: "Gulf Port Operations",
      beneficiaryIban: "AE990330000000998877665",
      amount: "280000.00",
      currency: "AED",
      valueDate: "2026-09-15",
      reason: "Maritime Freight Terminal Fees",
    };

    const createRes = await request(session.app)
      .post("/api/v1/payments/outbound")
      .set("Authorization", `Bearer ${session.token}`)
      .set("Idempotency-Key", "pay-gulf-port")
      .send(payPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe("pending_approval");

    // Verify approval record was created in the central inbox
    const approvalsRes = await request(session.app)
      .get("/api/v1/approvals")
      .set("Authorization", `Bearer ${session.token}`);
    
    const matchingApr = approvalsRes.body.find((a: any) => a.subjectId === createRes.body.id);
    expect(matchingApr).toBeTruthy();
    expect(matchingApr.status).toBe("pending");

    // Attempt self-approval by maker (must be blocked)
    const selfApprove = await request(session.app)
      .post(`/api/v1/approvals/${matchingApr.id}/decisions`)
      .set("Authorization", `Bearer ${session.token}`)
      .set("Idempotency-Key", "self-approve-attempt")
      .send({ decision: "approved" });

    expect(selfApprove.status).toBe(403);
    expect(selfApprove.body.error.code).toBe("MAKER_CHECKER_CONFLICT");
  });

  it("exports cash position report with control totals and audit trail", async () => {
    const session = await authenticate();
    const res = await request(session.app)
      .get("/api/v1/reports/cash-position.csv")
      .set("Authorization", `Bearer ${session.token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Treasury Atom Consolidated Cash Position");
    expect(res.text).toContain("Control Total (Consolidated)");
    expect(res.text).toContain("MATCHED");
  });

  it("exposes connector health status and deterministic agent run logs", async () => {
    const session = await authenticate();
    
    const connRes = await request(session.app)
      .get("/api/v1/connectors")
      .set("Authorization", `Bearer ${session.token}`);
    expect(connRes.status).toBe(200);
    expect(connRes.body.some((c: any) => c.name.includes("Kyriba"))).toBe(true);

    const agentRes = await request(session.app)
      .get("/api/v1/agents/runs")
      .set("Authorization", `Bearer ${session.token}`);
    expect(agentRes.status).toBe(200);
    expect(agentRes.body.length).toBeGreaterThan(0);
    expect(agentRes.body[0].agentName).toContain("TA–01");
  });
});
