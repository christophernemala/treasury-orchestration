import { FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CircleGauge,
  Database,
  FileCheck2,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ConnectionStatus, DashboardData, Transaction } from "../types";
import type { PageName } from "./ObsidianDashboard";

interface Props {
  dashboard: DashboardData;
  transactions: Transaction[];
  connectionStatus: ConnectionStatus;
  lastEventAt: string | null;
  onNavigate: (page: PageName) => void;
}

const money = (value: number, currency = "AED") =>
  `${currency} ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value)}`;

const prompts = [
  "What needs attention before close?",
  "Explain the reconciliation exceptions",
  "Which evidence should I review next?",
];

function buildAnswer(question: string, data: DashboardData, transactions: Transaction[]) {
  const open = transactions.filter((item) => item.status !== "matched");
  const exceptions = transactions.filter((item) => item.status === "exception");
  const evidenceCount = data.statements?.length ?? 0;
  const q = question.toLowerCase();

  if (q.includes("evidence")) {
    return `${evidenceCount} statement record${evidenceCount === 1 ? " is" : "s are"} available in this workspace. Review Banking first, then confirm supporting evidence before changing any close status.`;
  }
  if (q.includes("exception") || q.includes("reconcil")) {
    return `${open.length} transaction${open.length === 1 ? " remains" : "s remain"} outside matched status, including ${exceptions.length} exception${exceptions.length === 1 ? "" : "s"}. Open Reconciliation to inspect the source record and record a human decision.`;
  }
  return `${open.length} reconciliation item${open.length === 1 ? "" : "s"} need review. The current match rate is ${data.reconciliation.matchRate}%. No external payment or ledger posting will be initiated from this assistant.`;
}

export function TreasuryIntelligencePortal({
  dashboard,
  transactions,
  connectionStatus,
  lastEventAt,
  onNavigate,
}: Props) {
  const reduce = useReducedMotion();
  const [question, setQuestion] = useState(prompts[0]);
  const [answer, setAnswer] = useState(() => buildAnswer(prompts[0], dashboard, transactions));
  const [activePrompt, setActivePrompt] = useState(prompts[0]);
  const openItems = transactions.filter((item) => item.status !== "matched");
  const totalCash = dashboard.balances.reduce((sum, item) => sum + item.balance, 0);
  const evidenceCount = dashboard.statements?.length ?? 0;
  const generated = useMemo(
    () => (lastEventAt ? new Date(lastEventAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Awaiting live snapshot"),
    [lastEventAt],
  );

  function investigate(event: FormEvent) {
    event.preventDefault();
    const next = question.trim();
    if (!next) return;
    setActivePrompt(next);
    setAnswer(buildAnswer(next, dashboard, transactions));
  }

  return (
    <div className="ti-page">
      <section className="ti-hero">
        <div className="ti-hero-copy">
          <div className="ti-kicker"><Sparkles size={14} /> EVIDENCE-BOUND TREASURY INTELLIGENCE</div>
          <h2>Ask the workspace.<br />Inspect every conclusion.</h2>
          <p>
            Treasury Atom interprets the records already loaded into this development workspace.
            It can explain and propose, while every durable decision remains behind a human review gate.
          </p>
          <div className="ti-hero-actions">
            <button className="primary" onClick={() => onNavigate("Reconciliation")}>Review open items <ArrowRight size={16} /></button>
            <button className="ti-quiet-button" onClick={() => onNavigate("Audit")}>Inspect audit receipts</button>
          </div>
        </div>
        <div className="ti-atom-stage" aria-label={`Treasury intelligence status: ${connectionStatus}`}>
          <motion.div
            className="ti-orbit ti-orbit-one"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          ><i /><i /><i /></motion.div>
          <motion.div
            className="ti-orbit ti-orbit-two"
            animate={reduce ? undefined : { rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          ><i /><i /></motion.div>
          <motion.div
            className="ti-core"
            animate={reduce ? undefined : { y: [0, -7, 0], scale: [1, 1.025, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >TA</motion.div>
          <div className="ti-status-card ti-status-left"><b>{dashboard.reconciliation.matchRate}%</b><span>reconciled</span></div>
          <div className="ti-status-card ti-status-right"><b>{connectionStatus === "connected" ? "Live" : "REST"}</b><span>{generated}</span></div>
        </div>
      </section>

      <section className="ti-signal-grid" aria-label="Current treasury signals">
        <article><Landmark /><span>Cash in view</span><b>{money(totalCash)}</b><small>{dashboard.balances.length} recorded accounts · illustrative</small></article>
        <article><CircleGauge /><span>Reconciliation</span><b>{dashboard.reconciliation.matchRate}%</b><small>{openItems.length} items require review</small></article>
        <article><FileCheck2 /><span>Evidence records</span><b>{evidenceCount}</b><small>Uploaded or recorded statement files</small></article>
        <article><ShieldCheck /><span>Mutation mode</span><b>Propose only</b><small>Human approval remains mandatory</small></article>
      </section>

      <div className="ti-workspace-grid">
        <section className="ti-panel ti-assistant">
          <header><div><span>CONTROLLED ASSISTANT</span><h3>Investigate the close</h3></div><div className="ti-live"><i /> Local evidence</div></header>
          <div className="ti-prompt-list">
            {prompts.map((prompt) => (
              <button key={prompt} className={activePrompt === prompt ? "active" : ""} onClick={() => { setQuestion(prompt); setActivePrompt(prompt); setAnswer(buildAnswer(prompt, dashboard, transactions)); }}>
                {prompt}<ArrowRight size={14} />
              </button>
            ))}
          </div>
          <div className="ti-answer">
            <div className="ti-answer-icon"><Bot size={18} /></div>
            <div><span>TREASURY ATOM RESPONSE</span><p>{answer}</p><small><LockKeyhole size={12} /> Generated from current application state; verify source evidence before action.</small></div>
          </div>
          <form onSubmit={investigate} className="ti-question">
            <Search size={17} />
            <input aria-label="Ask Treasury Atom" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about balances, evidence or reconciliation" />
            <button aria-label="Investigate question"><ArrowRight size={16} /></button>
          </form>
        </section>

        <section className="ti-panel ti-controls">
          <header><div><span>DECISION CONTROL</span><h3>Trust boundary</h3></div><ShieldCheck size={20} /></header>
          <div className="ti-control-flow">
            <div className="complete"><Database /><b>Read</b><span>Workspace records</span></div>
            <i />
            <div className="complete"><Network /><b>Reason</b><span>Deterministic summary</span></div>
            <i />
            <div><MessageSquareText /><b>Propose</b><span>Reviewer decision</span></div>
          </div>
          <div className="ti-boundary-note">
            <LockKeyhole size={18} />
            <div><b>No autonomous mutations</b><span>Bank APIs, ERP posting and payment initiation are not connected. The operational reconciliation page records reviewed changes in the local prototype only.</span></div>
          </div>
          <button className="ti-link" onClick={() => onNavigate("Approvals")}>Open approval center <ArrowRight size={15} /></button>
        </section>
      </div>

      <section className="ti-panel ti-sources">
        <header><div><span>SOURCE READINESS</span><h3>Connected evidence, without invented integrations</h3></div><span className="ti-mode">Development workspace</span></header>
        <div className="ti-source-grid">
          <article><div className="ti-source-mark">BS</div><div><b>Bank statements</b><span>CSV/XLSX ingestion available</span></div><em className={evidenceCount ? "ready" : ""}>{evidenceCount ? `${evidenceCount} recorded` : "Awaiting upload"}</em></article>
          <article><div className="ti-source-mark">GL</div><div><b>General ledger</b><span>Local mock journal records</span></div><em className="review">Review required</em></article>
          <article><div className="ti-source-mark">API</div><div><b>Bank and ERP APIs</b><span>Future connector boundary</span></div><em>Not connected</em></article>
        </div>
      </section>
    </div>
  );
}
