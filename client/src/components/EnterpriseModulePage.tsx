import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, CircleCheck, Database, Network, RefreshCw, Search, X } from "lucide-react";
import { api } from "../api";
import type { PageName } from "./ObsidianDashboard";
import { DataConnectionMap } from "./DataConnectionMap";

type RecordValue = string | number | undefined;
type Row = Record<string, RecordValue>;

const configs: Record<Exclude<PageName, "Dashboard" | "Intelligence" | "Reconciliation" | "Ledger">, { endpoint: string; kicker: string; description: string; columns: Array<[string, string]> }> = {
  Customers: { endpoint: "/v1/customers", kicker: "CUSTOMER MASTER", description: "Entity-scoped counterparties, ownership and credit-control posture.", columns: [["code","Code"],["legalName","Legal name"],["terms","Terms"],["creditStatus","Credit"],["owner","Owner"],["status","Status"]] },
  Invoices: { endpoint: "/v1/invoices", kicker: "RECEIVABLES CONTROL", description: "Controlled invoice lifecycle with fixed-precision values and approval gates.", columns: [["number","Invoice"],["customerId","Customer"],["issueDate","Issued"],["dueDate","Due"],["currency","CCY"],["total","Total"],["openAmount","Open"],["status","Status"]] },
  Banking: { endpoint: "/v1/bank-accounts", kicker: "BANK ACCOUNT VISIBILITY", description: "Illustrative account positions. No live bank connection is represented.", columns: [["bankName","Bank"],["maskedAccount","Account"],["currency","CCY"],["availableBalance","Available"],["feedProvider","Feed"],["status","Status"]] },
  Payments: { endpoint: "/v1/payments", kicker: "PAYMENT TRACKING", description: "Lifecycle events and identifiers without payment initiation.", columns: [["trackingNumber","Tracking"],["direction","Direction"],["valueDate","Value date"],["currency","CCY"],["amount","Amount"],["status","Status"]] },
  Escrow: { endpoint: "/v1/escrow/accounts", kicker: "ESCROW CONNECTOR", description: "Provider-neutral mock adapter pending KRIBA vendor validation and configuration.", columns: [["provider","Provider"],["providerMode","Mode"],["currency","CCY"],["availableBalance","Available"],["pendingBalance","Pending"],["status","Status"]] },
  Entities: { endpoint: "/v1/legal-entities", kicker: "LEGAL-ENTITY MASTER", description: "The data boundary used for permissions, ownership and audit scope.", columns: [["code","Code"],["legalName","Legal name"],["country","Country"],["baseCurrency","Base CCY"],["taxId","Tax ID"],["status","Status"]] },
  Approvals: { endpoint: "/v1/approvals", kicker: "MAKER–CHECKER CONTROL", description: "Pending and completed human decisions for controlled mutations.", columns: [["subjectType","Subject"],["action","Action"],["makerId","Maker"],["checkerId","Checker"],["status","Status"],["decidedAt","Decided"]] },
  Audit: { endpoint: "/v1/audit-events", kicker: "IMMUTABLE RECEIPTS", description: "Actor, entity, subject and correlation evidence for material actions.", columns: [["occurredAt","Time"],["action","Action"],["actorId","Actor"],["subjectType","Subject"],["subjectId","Record"],["correlationId","Correlation"]] },
};

function display(value: RecordValue) {
  if (value === undefined || value === "") return "—";
  return String(value).replaceAll("_", " ");
}

export function EnterpriseModulePage({ page }: { page: keyof typeof configs }) {
  const config = configs[page];
  const query = useQuery({ queryKey: ["platform", page], queryFn: () => api<Row[]>(config.endpoint) });
  const records = query.data ?? [];
  const [filter, setFilter] = useState("");
  const [showConnections, setShowConnections] = useState(page === "Customers");
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredRecords = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)));
  }, [filter, records]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key.toLowerCase() === "k" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "r" && !isTyping) {
        event.preventDefault();
        void query.refetch();
      }
      if (event.key.toLowerCase() === "d" && !isTyping) {
        event.preventDefault();
        setShowConnections((visible) => !visible);
      }
      if (event.key === "Escape") {
        setFilter("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query]);

  return (
    <div className="module-page" data-module={page.toLowerCase()}>
      <section className="module-hero card">
        <div>
          <span className="section-kicker">{config.kicker}</span>
          <h2>{page}</h2>
          <p>{config.description}</p>
        </div>
        <div className="module-health"><CircleCheck size={18}/><div><b>Scoped and governed</b><span>{records.length} illustrative records</span></div></div>
      </section>
      <div className="module-commandbar" aria-label="Workspace keyboard actions">
        <label className="module-search" htmlFor="module-record-search"><Search size={16}/><input ref={searchRef} id="module-record-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={`Search ${page.toLowerCase()}…`} />{filter && <button onClick={() => setFilter("")} aria-label="Clear search"><X size={15}/></button>}<kbd>K</kbd></label>
        <button className="command-button" onClick={() => setShowConnections((visible) => !visible)} aria-expanded={showConnections}><Network size={16}/><span>{showConnections ? "Hide" : "Show"} data map</span><kbd>D</kbd></button>
        <button className="command-button" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "spin" : ""} size={16}/><span>{query.isFetching ? "Refreshing" : "Refresh"}</span><kbd>R</kbd></button>
      </div>
      {showConnections && page === "Customers" && <DataConnectionMap recordCount={records.length} />}
      {page === "Escrow" && <div className="integration-warning"><AlertTriangle size={17}/><div><b>Connector is not live</b><span>KRIBA is represented only as a mock provider contract. No balance query or release is sent externally.</span></div></div>}
      <section className="card panel table-panel module-panel">
        <header><div><span className="section-kicker">OPERATIONAL REGISTER</span><h3>{page} workspace</h3></div><button className="secondary" onClick={() => query.refetch()}><RefreshCw size={15}/> Refresh</button></header>
        {query.isError ? <div className="empty"><AlertTriangle/><div><b>Module could not load</b><span>{query.error.message}</span></div></div> : query.isLoading ? <div className="loading compact">Loading governed records…</div> : (
          filteredRecords.length ? <div className="table-wrap"><table><thead><tr>{config.columns.map(([,label])=><th key={label}>{label}</th>)}<th/></tr></thead><tbody>{filteredRecords.map((row)=><tr key={String(row.id)}>{config.columns.map(([key])=><td key={key}><span className={key === "status" ? "module-status" : ""}>{display(row[key])}</span></td>)}<td><button className="text-button" aria-label={`Open ${row.id}`}><ArrowUpRight size={15}/></button></td></tr>)}</tbody></table></div> : <div className="empty"><Search/><div><b>No matching records</b><span>Clear or change the search phrase.</span></div></div>
        )}
        <footer className="module-foot"><Database size={14}/> Development repository · {filteredRecords.length} of {records.length} illustrative records · entity scope enforced by the API</footer>
      </section>
    </div>
  );
}
