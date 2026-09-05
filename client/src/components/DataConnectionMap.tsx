import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Database,
  FileCheck2,
  Landmark,
  MessageSquareText,
  Network,
  PlugZap,
  ShieldCheck,
} from "lucide-react";

type ConnectionState = "development" | "not-configured" | "contract-only";

const connections = [
  {
    id: "erp",
    label: "ERP & GL",
    detail: "API contract is defined; no production ERP credentials or live general-ledger feed are configured.",
    state: "contract-only" as ConnectionState,
    stateLabel: "Contract only",
    icon: Building2,
    tone: "violet",
  },
  {
    id: "banking",
    label: "Banking",
    detail: "Development repository contains reviewed illustrative statements. No bank API or live balance connection is active.",
    state: "development" as ConnectionState,
    stateLabel: "Development data",
    icon: Landmark,
    tone: "teal",
  },
  {
    id: "evidence",
    label: "Evidence",
    detail: "Documents can be linked to governed records. External document storage is not configured in this environment.",
    state: "not-configured" as ConnectionState,
    stateLabel: "Not configured",
    icon: FileCheck2,
    tone: "amber",
  },
  {
    id: "communications",
    label: "Communications",
    detail: "The communication workflow is prepared for a provider adapter. Customer.io is not connected and no message is sent externally.",
    state: "not-configured" as ConnectionState,
    stateLabel: "Not connected",
    icon: MessageSquareText,
    tone: "coral",
  },
];

export function DataConnectionMap({ recordCount }: { recordCount: number }) {
  const [selectedId, setSelectedId] = useState(connections[0].id);
  const reduceMotion = useReducedMotion();
  const selected = connections.find((item) => item.id === selectedId) ?? connections[0];

  return (
    <section className="connection-widget card" aria-labelledby="connection-title">
      <header className="connection-heading">
        <div>
          <span className="section-kicker">DATA CONNECTION POINT</span>
          <h3 id="connection-title">Customer intelligence fabric</h3>
          <p>Select a source to inspect its real integration state.</p>
        </div>
        <span className="connection-truth"><ShieldCheck size={15} /> Truth-labelled</span>
      </header>

      <div className="connection-layout">
        <div className="connection-map" role="group" aria-label="Customer data sources">
          <div className="connection-lines" aria-hidden="true">
            <i className="line north" /><i className="line east" /><i className="line south" /><i className="line west" />
          </div>
          <div className="connection-core">
            <span><Database size={21} /></span>
            <b>Customer master</b>
            <small>{recordCount} illustrative records</small>
          </div>
          {connections.map((connection, index) => {
            const Icon = connection.icon;
            const active = connection.id === selected.id;
            return (
              <motion.button
                key={connection.id}
                className={`connection-node node-${index + 1} tone-${connection.tone}`}
                aria-pressed={active}
                onClick={() => setSelectedId(connection.id)}
                whileTap={reduceMotion ? undefined : { scale: .98 }}
                transition={{ duration: .18 }}
              >
                <span><Icon size={17} /></span>
                <b>{connection.label}</b>
                <small>{connection.stateLabel}</small>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.aside
            key={selected.id}
            className={`connection-detail tone-${selected.tone}`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: .2 }}
            aria-live="polite"
          >
            <div className="connection-detail-title"><PlugZap size={18} /><span><small>SELECTED SOURCE</small><b>{selected.label}</b></span></div>
            <span className={`connection-state state-${selected.state}`}><i />{selected.stateLabel}</span>
            <p>{selected.detail}</p>
            <div className="connection-boundary"><Network size={15} /><span><b>Control boundary</b><small>No external read or mutation occurs from this panel.</small></span></div>
          </motion.aside>
        </AnimatePresence>
      </div>
    </section>
  );
}
