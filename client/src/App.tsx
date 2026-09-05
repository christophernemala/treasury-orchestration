import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  EyeOff,
  FileSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Unplug,
  WalletCards,
  X,
} from "lucide-react";
import { api, clearToken, downloadCsv, getToken, setToken } from "./api";
import type { ConnectionStatus, DashboardData, Transaction, TxStatus } from "./types";
import { useLiveTreasury } from "./hooks/useLiveTreasury";
import { NAV_ITEMS, ObsidianDashboard } from "./components/ObsidianDashboard";
import type { PageName } from "./components/ObsidianDashboard";
import { EnterpriseModulePage } from "./components/EnterpriseModulePage";
import { MotionWorkspace } from "./components/motion/MotionWorkspace";
import { TreasuryIntelligencePortal } from "./components/TreasuryIntelligencePortal";

const PAGE_ROUTES: Record<PageName, string> = {
  Dashboard: "/app",
  Intelligence: "/app/intelligence",
  Customers: "/app/crm",
  Invoices: "/app/invoices",
  Banking: "/app/banking",
  Reconciliation: "/app/reconciliation",
  Payments: "/app/payments",
  Escrow: "/app/escrow",
  Ledger: "/app/ledger",
  Entities: "/app/entities",
  Approvals: "/app/approvals",
  Audit: "/app/audit",
};

const money = (n: number, c = "AED") =>
  `${c} ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n)}`;
const statusTone: Record<string, string> = {
  matched: "good",
  suggested: "violet",
  unmatched: "warn",
  exception: "danger",
  complete: "good",
  running: "blue",
  attention: "warn",
};

function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"login" | "otp">("login"),
    [email, setEmail] = useState("admin@treasury.local"),
    [password, setPassword] = useState("Treasury123!"),
    [otp, setOtp] = useState("246810"),
    [challenge, setChallenge] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [remember, setRemember] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "login") {
        const r = await api<any>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setChallenge(r.challengeId);
        setOtp(r.devOtp || "");
        setStep("otp");
      } else {
        const r = await api<any>("/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ challengeId: challenge, otp }),
        });
        setToken(r.token);
        onDone();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-shell">
      <div className="login-copy">
        <div className="brand">
          <span className="atom-mark" aria-hidden="true"><i /><i /><i /><b>TA</b></span>
          <span className="brand-name">Treasury Atom<small>Governed intelligence</small></span>
        </div>
        <div className="eyebrow">
          SECURE TREASURY WORKSPACE
        </div>
        <h1>
          {step === "login"
            ? "Welcome back."
            : "Confirm it’s you."}
        </h1>
        <p>
          {step === "login"
            ? "Sign in to your governed liquidity and risk command center."
            : "Enter the development OTP. No email or external service is contacted."}
        </p>
        <form onSubmit={submit}>
          <label>
            {step === "login" ? "Work email" : "One-time passcode"}
            <input
              name={step === "login" ? "email" : "otp"}
              autoFocus
              value={step === "login" ? email : otp}
              onChange={(e) =>
                step === "login"
                  ? setEmail(e.target.value)
                  : setOtp(e.target.value)
              }
              type={step === "login" ? "email" : "text"}
            />
          </label>
          {step === "login" && (
            <label>
              Password
              <span className="password-field">
                <input name="password" value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
          </label>
          )}
          {step === "login" && <div className="login-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember this device</label><button type="button" className="forgot">Forgot password?</button></div>}
          {error && <div className="error">{error}</div>}
          <button className="primary wide" disabled={busy}>
            {busy
              ? "Checking…"
              : step === "login"
                ? "Enter Treasury Atom"
                : "Open workspace"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="demo-note">
          <ShieldCheck size={17} />
          <span>
            <b>Role-based access and audit controls.</b> Development credentials are prefilled. OTP: 246810.
          </span>
        </div>
      </div>
      <div className="robo-panel">
        <div className="robo-grid" />
        <div className="robo-heading"><span>TREASURY ATOM ASSISTANT</span><b>TA–01</b></div>
        <motion.div
          className="orb"
          animate={{ y: [0, -5, 0], rotateY: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/assets/treasury-atom-assistant.png"
            alt="Treasury Atom's silver humanoid assistant in a dark command environment"
          />
        </motion.div>
        <motion.div className="signal-card liquidity-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}><span>LIQUIDITY SIGNAL</span><strong>+AED 14.8M</strong><small>Expected Thursday · 94% confidence</small></motion.div>
        <motion.div className="signal-card policy-card" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .55 }}><span>POLICY CONTROL</span><strong><Check size={15}/> Verified</strong><small>Maker-checker review ready</small></motion.div>
        <motion.div className="signal-card answer-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8 }}><span>ATOM RESPONSE</span><p>Moving EMEA funding forward could reduce Thursday’s liquidity gap by AED 3.2M.</p></motion.div>
        <div className="robo-caption">
          <span className="live-dot" /> TA–01 ONLINE
          <small>Governed intelligence · 24ms</small>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon, tone = "blue" }: any) {
  return (
    <motion.div className="metric card" whileHover={{ y: -3 }}>
      <div className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </motion.div>
  );
}

function Dashboard({
  data,
  setPage,
  connectionStatus,
  lastEventAt,
}: {
  data: DashboardData;
  setPage: (p: PageName) => void;
  connectionStatus: ConnectionStatus;
  lastEventAt: string | null;
}) {
  return (
    <>
      <div className="hero card">
        <div>
          <div className="eyebrow">TREASURY CONTROL ROOM</div>
          <h2>Good morning, Amina.</h2>
          <p>
            Three items need a human decision before today’s development close
            can progress.
          </p>
          <button className="primary" onClick={() => setPage("Reconciliation")}>
            Review exceptions <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-status">
          <div
            className="ring"
            style={
              { "--pct": `${data.reconciliation.matchRate * 3.6}deg` } as any
            }
          >
            <b>{data.reconciliation.matchRate}%</b>
            <span>matched</span>
          </div>
          <small>{data.reconciliation.total} seeded transactions · Aug 2026</small>
        </div>
      </div>
      <MotionWorkspace
        connectionStatus={connectionStatus}
        matchRate={data.reconciliation.matchRate}
        exceptions={data.reconciliation.exception + data.reconciliation.unmatched}
        lastEventAt={lastEventAt}
      />
      <div className="metrics">
        <Metric
          label="Illustrative cash visibility"
          value={money(data.balances[0]?.balance || 0)}
          detail="Emirates NBD · AED"
          icon={WalletCards}
        />
        <Metric
          label="Reconciliation"
          value={`${data.reconciliation.matched}/${data.reconciliation.total}`}
          detail={`${data.reconciliation.suggested} suggestions await review`}
          icon={FileSearch}
          tone="violet"
        />
        <Metric
          label="Unapplied cash"
          value={money(data.unapplied.total)}
          detail={`${data.unapplied.count} open seeded item`}
          icon={CircleDollarSign}
          tone="amber"
        />
        <Metric
          label="Agent guardrails"
          value="Active"
          detail="No external actions permitted"
          icon={ShieldCheck}
          tone="green"
        />
      </div>
      <div className="dashboard-grid">
        <section className="card panel">
          <header>
            <div>
              <span className="section-kicker">CASH POSITION</span>
              <h3>Accounts in view</h3>
            </div>
            <span className="sample-pill">Illustrative</span>
          </header>
          {data.balances.map((b, i) => (
            <div className="account-row" key={b.account}>
              <div className="bank-mark">{i ? "HS" : "EN"}</div>
              <div>
                <b>{b.account}</b>
                <span>{i ? "HSBC UAE" : "Emirates NBD"}</span>
              </div>
              <strong>{money(b.balance, b.currency)}</strong>
              <ChevronRight size={18} />
            </div>
          ))}
        </section>
        <section className="card panel">
          <header>
            <div>
              <span className="section-kicker">AGENT OPERATIONS</span>
              <h3>Automation with checkpoints</h3>
            </div>
            <button className="icon-button" aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
          </header>
          {data.agentTasks.map((t) => (
            <div className="task-row" key={t.id}>
              <span className={`status-dot ${statusTone[t.status]}`} />
              <div>
                <b>{t.name}</b>
                <span>{t.detail}</span>
              </div>
              <span className={`badge ${statusTone[t.status]}`}>
                {t.status}
              </span>
            </div>
          ))}
        </section>
      </div>
      <section className="card panel timeline">
        <header>
          <div>
            <span className="section-kicker">RECENT CONTROL EVENTS</span>
            <h3>Audit receipt timeline</h3>
          </div>
          <button
            className="secondary"
            onClick={() => setPage("Audit")}
          >
            View all
          </button>
        </header>
        <div className="audit-grid">
          {data.audit.slice(0, 4).map((a: any) => (
            <div className="audit-item" key={a.id}>
              <ShieldCheck size={15} />
              <div>
                <b>{a.action}</b>
                <span>{a.detail}</span>
                <small>
                  {new Date(a.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {a.actor}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Transactions({
  items,
  reload,
}: {
  items: Transaction[];
  reload: () => void;
}) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("all"),
    [editing, setEditing] = useState<Transaction | null>(null);
  const shown = items.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      [t.description, t.reference, t.counterparty]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await api(editing.id ? `/transactions/${editing.id}` : "/transactions", {
      method: editing.id ? "PATCH" : "POST",
      body: JSON.stringify(editing),
    });
    setEditing(null);
    reload();
  }
  return (
    <section className="card panel table-panel">
      <header>
        <div>
          <span className="section-kicker">MOCK LEDGER</span>
          <h3>Transactions</h3>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => downloadCsv()}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="primary"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              setEditing({ id: "", date: today, valueDate: today, description: "", amount: 0, currency: "AED", account: "Operating • 4921", reference: "", status: "unmatched", counterparty: "", category: "Uncategorized" });
            }}
          >
            <Plus size={15} /> Add entry
          </button>
        </div>
      </header>
      <div className="filters">
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search transactions"
            placeholder="Search reference, payer or description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {["matched", "suggested", "unmatched", "exception"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id}>
                <td>{t.date.slice(5)}</td>
                <td>
                  <b>{t.description}</b>
                  <span>
                    {t.reference} · {t.counterparty}
                  </span>
                </td>
                <td>{t.account}</td>
                <td className={t.amount < 0 ? "negative" : ""}>
                  {money(t.amount, t.currency)}
                </td>
                <td>
                  <span className={`badge ${statusTone[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  <button
                    className="text-button"
                    onClick={() => setEditing({ ...t })}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              className="modal"
              onSubmit={save}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 25, opacity: 0 }}
            >
              <header>
                <h3>{editing.id ? "Review transaction" : "Record transaction"}</h3>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setEditing(null)}
                >
                  <X />
                </button>
              </header>
              <label>
                Description
                <input
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Transaction date
                  <input type="date" required value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
                </label>
                <label>
                  Value date
                  <input type="date" required value={editing.valueDate} onChange={(e) => setEditing({ ...editing, valueDate: e.target.value })} />
                </label>
                <label>
                  Amount
                  <input type="number" step="0.01" required value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} />
                </label>
                <label>
                  Currency
                  <input maxLength={3} required value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })} />
                </label>
              </div>
              <label>
                Account
                <input required value={editing.account} onChange={(e) => setEditing({ ...editing, account: e.target.value })} />
              </label>
              <div className="form-grid">
                <label>
                  Reference
                  <input value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} />
                </label>
                <label>
                  Counterparty
                  <input value={editing.counterparty} onChange={(e) => setEditing({ ...editing, counterparty: e.target.value })} />
                </label>
              </div>
              <label>
                Status
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as TxStatus,
                    })
                  }
                >
                  {["unmatched", "suggested", "matched", "exception"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Reviewer note
                <textarea
                  value={editing.notes || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </label>
              <button className="primary">{editing.id ? "Save reviewed change" : "Record transaction"}</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Reconciliation({
  items,
  reload,
}: {
  items: Transaction[];
  reload: () => void;
}) {
  const candidates = items.filter((t) => t.status !== "matched");
  const [selected, setSelected] = useState<Transaction | null>(
      candidates[0] || null,
    ),
    [suggestions, setSuggestions] = useState<any[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (selected)
      api<any[]>(`/reconciliation/suggestions/${selected.id}`).then(
        setSuggestions,
      );
  }, [selected?.id]);
  async function decide(decision: "matched" | "exception") {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/reconciliation/${selected.id}`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          journalId:
            decision === "matched" ? suggestions[0]?.journal.id : undefined,
          note: "Human decision recorded in prototype",
        }),
      });
      reload();
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="recon-layout">
      <section className="card panel recon-list">
        <header>
          <div>
            <span className="section-kicker">REVIEW QUEUE</span>
            <h3>Needs a decision</h3>
          </div>
          <span className="badge warn">{candidates.length} open</span>
        </header>
        {candidates.map((t) => (
          <button
            className={`recon-item ${selected?.id === t.id ? "active" : ""}`}
            onClick={() => setSelected(t)}
            key={t.id}
          >
            <span className={`status-dot ${statusTone[t.status]}`} />
            <div>
              <b>{t.description}</b>
              <span>
                {t.reference} · {money(t.amount, t.currency)}
              </span>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
      </section>
      <section className="card panel review-pane">
        {selected ? (
          <>
            <div className="eyebrow">HUMAN APPROVAL GATE</div>
            <h2>{selected.description}</h2>
            <p>
              {selected.account} · {selected.date} · {selected.reference}
            </p>
            <div className="amount-block">
              <span>Statement amount</span>
              <strong>{money(selected.amount, selected.currency)}</strong>
            </div>
            <h3>Agent suggestion</h3>
            {suggestions[0] ? (
              <div className="suggestion">
                <div className="confidence">
                  <Sparkles size={16} />
                  <b>{suggestions[0].score}% confidence</b>
                </div>
                <strong>{suggestions[0].journal.description}</strong>
                <span>
                  {suggestions[0].journal.reference} ·{" "}
                  {money(
                    suggestions[0].journal.amount,
                    suggestions[0].journal.currency,
                  )}
                </span>
                <small>
                  Based on exact amount, reference, currency and date proximity.
                </small>
              </div>
            ) : (
              <div className="empty">
                <Unplug />
                <b>No safe suggestion</b>
                <span>
                  Investigate manually; the agent will not force a match.
                </span>
              </div>
            )}
            <div className="gate-note">
              <ShieldCheck />
              <div>
                <b>Nothing posts automatically</b>
                <span>
                  This action updates only the local development ledger and
                  writes an audit receipt.
                </span>
              </div>
            </div>
            <div className="actions">
              <button
                disabled={!suggestions[0] || busy}
                className="primary"
                onClick={() => decide("matched")}
              >
                <Check size={16} /> Approve match
              </button>
              <button
                disabled={busy}
                className="secondary danger-text"
                onClick={() => decide("exception")}
              >
                Mark exception
              </button>
            </div>
          </>
        ) : (
          <div className="empty tall">
            <Check />
            <b>Queue reviewed</b>
            <span>Select another item or return to the dashboard.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function SimplePage({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: any;
}) {
  return (
    <section className="card panel">
      <header>
        <div>
          <span className="section-kicker">{kicker}</span>
          <h3>{title}</h3>
        </div>
        <span className="sample-pill">Local development data</span>
      </header>
      {children}
    </section>
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const page = (Object.entries(PAGE_ROUTES).find(([, path]) => path === location.pathname)?.[0] as PageName | undefined) ?? "Dashboard";
  const setPage = (next: PageName) => navigate(PAGE_ROUTES[next]);
  const [authed, setAuthed] = useState(!!getToken()),
    [data, setData] = useState<DashboardData | null>(null),
    [tx, setTx] = useState<Transaction[]>([]);
  async function reload() {
    if (!getToken()) return;
    try {
      const [d, t] = await Promise.all([
        api<DashboardData>("/dashboard"),
        api<Transaction[]>("/transactions"),
      ]);
      setData(d);
      setTx(t);
    } catch {
      clearToken();
      setAuthed(false);
    }
  }
  useEffect(() => {
    if (authed) reload();
  }, [authed]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      const n = Number(e.key);
      if (n >= 1 && n <= NAV_ITEMS.length) navigate(PAGE_ROUTES[NAV_ITEMS[n - 1][0]]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
  const { snapshot, status, lastEventAt } = useLiveTreasury(data, getToken());
  const liveData = useMemo(
    () => (data && snapshot ? { ...data, ...snapshot } : data),
    [data, snapshot],
  );
  useEffect(() => {
    if (snapshot?.generatedAt) queryClient.invalidateQueries({ queryKey: ["platform"] });
  }, [snapshot?.generatedAt, queryClient]);
  const content = useMemo(() => {
    if (!liveData)
      return <div className="loading">Loading controlled workspace…</div>;
    if (page === "Dashboard")
      return <Dashboard data={liveData} setPage={setPage} connectionStatus={status} lastEventAt={lastEventAt} />;
    if (page === "Ledger")
      return <Transactions items={tx} reload={reload} />;
    if (page === "Reconciliation")
      return <Reconciliation items={tx} reload={reload} />;
    if (page === "Intelligence")
      return <TreasuryIntelligencePortal dashboard={liveData} transactions={tx} connectionStatus={status} lastEventAt={lastEventAt} onNavigate={setPage} />;
    return <EnterpriseModulePage page={page as Exclude<PageName, "Dashboard" | "Intelligence" | "Reconciliation" | "Ledger">} />;
  }, [liveData, page, tx, status, lastEventAt]);
  if (!authed) return <Login onDone={() => { setAuthed(true); navigate("/app"); }} />;
  return (
    <ObsidianDashboard
      page={page}
      onPageChange={setPage}
      connectionStatus={status}
      lastEventAt={lastEventAt}
      onLogout={() => {
        clearToken();
        setAuthed(false);
        navigate("/");
      }}
    >
      {content}
    </ObsidianDashboard>
  );
}
