import { ReactNode, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Landmark,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Menu,
  ReceiptText,
  ScanSearch,
  ScrollText,
  Sparkles,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConnectionStatus } from "../types";

export type PageName =
  | "Dashboard"
  | "Intelligence"
  | "Customers"
  | "Invoices"
  | "Banking"
  | "Reconciliation"
  | "Payments"
  | "Escrow"
  | "Ledger"
  | "Entities"
  | "Approvals"
  | "Audit";
export const NAV_ITEMS: Array<[PageName, LucideIcon]> = [
  ["Dashboard", LayoutDashboard],
  ["Intelligence", Sparkles],
  ["Customers", Users],
  ["Invoices", ReceiptText],
  ["Banking", Landmark],
  ["Reconciliation", ScanSearch],
  ["Payments", Send],
  ["Escrow", LockKeyhole],
  ["Ledger", BookOpen],
  ["Entities", Building2],
  ["Approvals", BadgeCheck],
  ["Audit", ScrollText],
];

const statusLabel: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Live stream connected",
  reconnecting: "Reconnecting",
  offline: "Stream offline",
};

interface Props {
  page: PageName;
  onPageChange: (page: PageName) => void;
  connectionStatus: ConnectionStatus;
  lastEventAt: string | null;
  onLogout: () => void;
  children: ReactNode;
}

export function ObsidianDashboard({
  page,
  onPageChange,
  connectionStatus,
  lastEventAt,
  onLogout,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const updated = lastEventAt
    ? new Date(lastEventAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Awaiting snapshot";
  return (
    <div className="obsidian-shell">
      <a className="skip-link" href="#workspace-content">Skip to workspace</a>
      <aside className={open ? "open" : ""}>
        <div className="brand">
          <span>TA</span> Treasury Atom
        </div>
        <button
          className="close-mobile"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav>
          {NAV_ITEMS.map(([name, Icon], index) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              aria-pressed={page === name}
              onClick={() => {
                onPageChange(name);
                setOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
              <kbd>{index < 9 ? index + 1 : "–"}</kbd>
            </button>
          ))}
        </nav>
        <div className="aside-control">
          <ShieldCheck size={18} />
          <div>
            <b>Controlled workspace</b>
            <span>Human approval gates active</span>
          </div>
        </div>
        <button className="logout" onClick={onLogout}>
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div>
            <h1>{page}</h1>
            <span
              className={`stream-status ${connectionStatus}`}
              role="status"
              aria-live="polite"
            >
              <i /> {statusLabel[connectionStatus]} · {updated}
            </span>
          </div>
          <div className="top-actions">
            <span className="sample-pill">Aug 2026 · Illustrative</span>
            <div className="avatar" aria-label="Treasury Atom workspace">TA</div>
          </div>
        </header>
        <motion.div
          id="workspace-content"
          className="content"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          key={page}
        >
          {children}
        </motion.div>
        <footer className="system-footer" aria-label="System information">
          <span>Treasury Atom · Controlled workspace</span>
          <span>API health: <b>{connectionStatus === "offline" ? "Unavailable" : "Ready"}</b></span>
          <span>All financial values remain illustrative until reviewed source evidence is connected.</span>
        </footer>
      </main>
    </div>
  );
}
