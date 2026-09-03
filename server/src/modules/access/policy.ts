import type { Role } from "../../models.js";

export const permissions = [
  "crm.read",
  "crm.write",
  "invoice.read",
  "invoice.create",
  "invoice.approve",
  "invoice.close",
  "ledger.read",
  "ledger.post",
  "ledger.period.close",
  "bank.read",
  "bank.reconcile",
  "payment.read",
  "payment.manage",
  "payment.release",
  "escrow.read",
  "escrow.manage",
  "escrow.release",
  "master.read",
  "master.create",
  "master.approve",
  "audit.read",
  "admin.manage",
] as const;

export type Permission = (typeof permissions)[number];

const treasuryPermissions: Permission[] = [
  "crm.read",
  "invoice.read",
  "invoice.create",
  "ledger.read",
  "bank.read",
  "bank.reconcile",
  "payment.read",
  "payment.manage",
  "escrow.read",
  "master.read",
  "audit.read",
];

export function accessForRole(role: Role) {
  return {
    permissions: role === "admin" ? [...permissions] : treasuryPermissions,
    legalEntityIds: ["le-northstar-ae", "le-northstar-difc"],
  };
}

