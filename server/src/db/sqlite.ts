import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Import DatabaseSync dynamically or directly from node:sqlite
// @ts-ignore - node:sqlite is available in Node 22.5+
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RUNTIME_DIR = join(__dirname, "../../../.runtime");
const DB_PATH = join(RUNTIME_DIR, "treasury.db");

let dbInstance: any = null;

export function getDatabase(inMemory = false): any {
  if (dbInstance && !inMemory) return dbInstance;

  if (!inMemory) {
    if (!existsSync(RUNTIME_DIR)) {
      mkdirSync(RUNTIME_DIR, { recursive: true });
    }
  }

  const db = new DatabaseSync(inMemory ? ":memory:" : DB_PATH);
  
  // Enable foreign keys and WAL mode for durability
  db.exec("PRAGMA foreign_keys = ON;");
  if (!inMemory) {
    try {
      db.exec("PRAGMA journal_mode = WAL;");
    } catch {
      // WAL might not be supported in some environments
    }
  }

  initSchema(db);

  if (!inMemory) {
    dbInstance = db;
  }
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // Ignore
    }
    dbInstance = null;
  }
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS legal_entities (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      code TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      country TEXT NOT NULL,
      base_currency TEXT NOT NULL DEFAULT 'AED',
      tax_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      masked_account TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      feed_provider TEXT NOT NULL DEFAULT 'manual',
      available_balance TEXT NOT NULL DEFAULT '0.00',
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS statements (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      statement_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      opening_balance TEXT NOT NULL,
      closing_balance TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'reconciled',
      imported_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      value_date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      reference TEXT NOT NULL DEFAULT '',
      counterparty TEXT NOT NULL DEFAULT 'Unknown',
      status TEXT NOT NULL DEFAULT 'unmatched',
      matched_journal_id TEXT,
      statement_id TEXT NOT NULL DEFAULT 'manual',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      reference TEXT NOT NULL DEFAULT '',
      account TEXT NOT NULL,
      matched INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_ref TEXT NOT NULL,
      merchant_account TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      fee TEXT NOT NULL DEFAULT '0.00',
      net_amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'captured',
      payout_ref TEXT,
      settlement_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      payout_ref TEXT NOT NULL,
      gross_amount TEXT NOT NULL,
      fees TEXT NOT NULL,
      net_amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      settlement_date TEXT NOT NULL,
      bank_account_id TEXT,
      bank_tx_id TEXT,
      status TEXT NOT NULL DEFAULT 'unmatched'
    );

    CREATE TABLE IF NOT EXISTS outbound_payments (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      beneficiary_name TEXT NOT NULL,
      beneficiary_iban TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      value_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      maker_id TEXT NOT NULL,
      checker_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_approval',
      kyriba_reference TEXT,
      events_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS escrow_accounts (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      reported_balance TEXT NOT NULL,
      restricted_balance TEXT NOT NULL,
      available_balance TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_verified_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS escrow_releases (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AED',
      reason TEXT NOT NULL,
      evidence_doc TEXT NOT NULL,
      maker_id TEXT NOT NULL,
      checker_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      approved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_hash TEXT,
      maker_id TEXT NOT NULL,
      checker_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      decided_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      trigger TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      proposals_count INTEGER NOT NULL DEFAULT 0,
      evidence_json TEXT NOT NULL DEFAULT '{}',
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
