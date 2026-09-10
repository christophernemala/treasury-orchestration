import React, { FormEvent, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Building2,
  FileText,
  Lock,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Link2,
  Plus,
  Info,
  Check,
  X,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { api, clearToken, downloadCsv, getToken, setToken } from "./api";
import { useLiveTreasury } from "./hooks/useLiveTreasury";
import { ObsidianDashboard } from "./components/ObsidianDashboard";
import type { PageName } from "./components/ObsidianDashboard";
import { TreasuryAtomLogo } from "./components/TreasuryAtomLogo";
import { AtomIllustration } from "./components/AtomIllustration";
import type {
  CashPosition,
  Statement,
  Collection,
  Settlement,
  OutboundPayment,
  EscrowAccount,
  EscrowRelease,
  Approval,
  ConnectorStatus,
  AgentRun,
} from "./types";

// Exact currency formatting
function formatMoney(amountStr: string | number, currency = "AED"): string {
  const num = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  if (isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// --------------------------------------------------------------------------
// LOGIN COMPONENT
// --------------------------------------------------------------------------
function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState(import.meta.env.DEV ? "admin@treasury.local" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "Treasury123!" : "");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "login") {
        const r = await api<{ challengeId: string; devOtp?: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setChallenge(r.challengeId);
        setOtp(r.devOtp || "");
        setStep("otp");
      } else {
        const r = await api<{ token: string }>("/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ challengeId: challenge, otp }),
        });
        setToken(r.token);
        onDone();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-viewport">
      {/* 3D Glowing Atom Stage on Left */}
      <div className="login-stage">
        <AtomIllustration />
      </div>

      {/* Login Form Panel on Right */}
      <div className="login-panel-container">
        <div className="login-header">
          <TreasuryAtomLogo size={32} textColor="#151B1E" />
          <h1>{step === "login" ? "Welcome back." : "Confirm it's you."}</h1>
          <p>
            {step === "login"
              ? "Sign in to your governed treasury workspace."
              : "Enter the single-use 6-digit development OTP."}
          </p>
        </div>

        <form className="login-form" onSubmit={submit}>
          {step === "login" ? (
            <>
              <div className="form-group">
                <label htmlFor="login-email">Work email</label>
                <div className="input-with-icon">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-with-icon">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="field-action"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember this device</span>
                </label>
                <span style={{ color: "#7E8B9B", cursor: "not-allowed" }}>Forgot password?</span>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="login-otp">One-time verification passcode</label>
              <div className="input-with-icon">
                <input
                  id="login-otp"
                  name="otp"
                  type="text"
                  required
                  autoFocus
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "18px", letterSpacing: "0.2em" }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="login-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Authenticating…" : step === "login" ? "Sign in" : "Verify & open workspace"}
            <ArrowRight size={16} />
          </button>
        </form>

        {step === "otp" && otp && (
          <div className="dev-otp-card">
            <strong>Development Authentication</strong>
            <span style={{ fontSize: "12px", color: "#7A6136" }}>
              Active single-use OTP for local environment:
            </span>
            <span className="dev-otp-code">{otp}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------------------------------
export function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [page, setPage] = useState<PageName>("Overview");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("AED");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [showNewEscrowModal, setShowNewEscrowModal] = useState(false);

  const queryClient = useQueryClient();
  const { snapshot, status: connectionStatus, lastEventAt } = useLiveTreasury(null, token);

  // Queries
  const cashPositionQuery = useQuery({
    queryKey: ["cash-positions", selectedCurrency, selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `&entityId=${selectedEntity}` : "";
      return api<CashPosition>(`/v1/cash-positions?currency=${selectedCurrency}${entityParam}`);
    },
    enabled: !!token,
  });

  const statementsQuery = useQuery({
    queryKey: ["statements", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<Statement[]>(`/v1/statements${entityParam}`);
    },
    enabled: !!token,
  });

  const approvalsQuery = useQuery({
    queryKey: ["approvals", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<Approval[]>(`/v1/approvals${entityParam}`);
    },
    enabled: !!token,
  });

  const collectionsQuery = useQuery({
    queryKey: ["collections", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<Collection[]>(`/v1/collections${entityParam}`);
    },
    enabled: !!token,
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<Settlement[]>(`/v1/settlements${entityParam}`);
    },
    enabled: !!token,
  });

  const paymentsQuery = useQuery({
    queryKey: ["outbound-payments", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<OutboundPayment[]>(`/v1/payments/outbound${entityParam}`);
    },
    enabled: !!token,
  });

  const escrowAccountsQuery = useQuery({
    queryKey: ["escrow-accounts", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<EscrowAccount[]>(`/v1/escrow/accounts${entityParam}`);
    },
    enabled: !!token,
  });

  const escrowReleasesQuery = useQuery({
    queryKey: ["escrow-releases", selectedEntity],
    queryFn: () => {
      const entityParam = selectedEntity !== "all" ? `?entityId=${selectedEntity}` : "";
      return api<EscrowRelease[]>(`/v1/escrow/releases${entityParam}`);
    },
    enabled: !!token,
  });

  const connectorsQuery = useQuery({
    queryKey: ["connectors"],
    queryFn: () => api<ConnectorStatus[]>("/v1/connectors"),
    enabled: !!token,
  });

  const agentRunsQuery = useQuery({
    queryKey: ["agent-runs"],
    queryFn: () => api<AgentRun[]>("/v1/agents/runs"),
    enabled: !!token,
  });

  function handleLogout() {
    clearToken();
    setTokenState(null);
  }

  if (!token) {
    return <Login onDone={() => setTokenState(getToken())} />;
  }

  const pendingApprovalsCount = approvalsQuery.data?.filter((a) => a.status === "pending").length ?? 0;
  const cashPos = cashPositionQuery.data;

  return (
    <ObsidianDashboard
      page={page}
      onPageChange={setPage}
      connectionStatus={connectionStatus}
      lastEventAt={lastEventAt}
      pendingApprovalsCount={pendingApprovalsCount}
      onLogout={handleLogout}
      onOpenImport={() => setShowImportModal(true)}
    >
      {/* --------------------------------------------------------------------
          OVERVIEW SCREEN (MATCHING CONCEPT DESIGN)
          -------------------------------------------------------------------- */}
      {page === "Overview" && (
        <>
          <div className="hero-banner">
            <div className="hero-title-row">
              <div className="hero-copy">
                <h1>Know your cash. Decide with clarity.</h1>
                <p>Connect your sources to build a verified cash position.</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowImportModal(true)}
              >
                <Upload size={16} />
                <span>Import statement</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-selectors">
                <select
                  className="filter-select"
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                >
                  <option value="all">All entities</option>
                  <option value="le-northstar-ae">Northstar UAE Ltd (Abu Dhabi)</option>
                  <option value="le-northstar-difc">Northstar Treasury DIFC (Dubai)</option>
                </select>

                <select
                  className="filter-select"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                </select>

                <div className="filter-select" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={13} color="#7E8B9B" />
                  <span>As of today</span>
                </div>
              </div>

              <div className="connection-status-pill">
                <span className={`status-dot ${connectorsQuery.data?.length ? "connected" : "offline"}`} />
                <span>
                  {connectorsQuery.data?.length
                    ? `${connectorsQuery.data.filter((c) => c.status === "connected" || c.status === "test_mode").length} sources connected`
                    : "No sources connected"}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">
                  Available cash
                  <Info
                    size={14}
                    className="kpi-info-btn"
                    onClick={() => setShowMetricModal(true)}
                  />
                </span>
              </div>
              <div className="kpi-value">
                {cashPos ? formatMoney(cashPos.availableCash, cashPos.currency) : "—"}
              </div>
              <div className="kpi-subtitle">Bank cash less restrictions</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">
                  Unreconciled value
                  <Info
                    size={14}
                    className="kpi-info-btn"
                    onClick={() => setShowMetricModal(true)}
                  />
                </span>
              </div>
              <div className="kpi-value">
                {formatMoney(
                  statementsQuery.data?.reduce(
                    (acc, s) => acc + (s.status === "unreconciled" ? parseFloat(s.closingBalance) : 0),
                    0
                  ) ?? 0,
                  selectedCurrency
                )}
              </div>
              <div className="kpi-subtitle">Awaiting transactions</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">
                  Pending approvals
                  <Info
                    size={14}
                    className="kpi-info-btn"
                    onClick={() => setShowMetricModal(true)}
                  />
                </span>
              </div>
              <div className="kpi-value">
                {pendingApprovalsCount === 0
                  ? "—"
                  : `${pendingApprovalsCount} request${pendingApprovalsCount > 1 ? "s" : ""}`}
              </div>
              <div className="kpi-subtitle">
                {pendingApprovalsCount === 0 ? "No requests submitted" : "Maker-checker review pending"}
              </div>
            </div>
          </div>

          {/* 2-Column Middle Grid */}
          <div className="overview-grid">
            {/* Left Column (2/3) */}
            <div className="overview-left">
              {/* Cash Visibility Card */}
              <div className="overview-card">
                <div className="overview-card-header">
                  <h2>Cash visibility</h2>
                  <span className="header-context">Connect your data to see your consolidated position.</span>
                </div>

                <div className="cash-flow-diagram-wrapper">
                  {/* Interactive Visual Flow */}
                  <div className="flow-visual-side">
                    <div className="source-nodes-row">
                      <div className="source-node">
                        <Building2 size={20} className="source-node-icon" />
                        <span>Bank accounts</span>
                      </div>
                      <div className="source-node">
                        <FileText size={20} className="source-node-icon" />
                        <span>Statements</span>
                      </div>
                      <div className="source-node">
                        <Lock size={20} className="source-node-icon" />
                        <span>Restrictions</span>
                      </div>
                    </div>

                    {/* Connecting SVG lines */}
                    <svg className="flow-connectors-svg" viewBox="0 0 300 48" fill="none">
                      <path d="M 50 0 V 24 H 150 V 48" stroke="#C3A77B" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M 150 0 V 48" stroke="#C3A77B" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M 250 0 V 24 H 150 V 48" stroke="#C3A77B" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>

                    <div className="flow-target-node">
                      <div className="target-circle-atom">
                        <TreasuryAtomLogo size={26} showText={false} />
                      </div>
                      <span>Your verified cash position</span>
                    </div>
                  </div>

                  {/* Callout Side */}
                  <div className="flow-callout-side">
                    <h3>Your cash position starts with a source.</h3>
                    <p>
                      Connect a bank account or import a statement to build your consolidated cash position with
                      exact decimal reconciliation and restricted cash segregation.
                    </p>
                    <div className="flow-callout-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setPage("Connections")}
                      >
                        <Link2 size={15} />
                        <span>Connect account</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowImportModal(true)}
                      >
                        <Upload size={15} />
                        <span>Import a file</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconciliation Workspace Table */}
              <div className="overview-card">
                <div className="overview-card-header">
                  <h2>Reconciliation workspace</h2>
                  <button
                    type="button"
                    className="calc-metric-link"
                    onClick={() => setPage("Reconciliation")}
                  >
                    <span>Open workspace</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {statementsQuery.data && statementsQuery.data.length > 0 ? (
                  <div className="treasury-table-wrapper">
                    <table className="treasury-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Statement date</th>
                          <th>Currency</th>
                          <th style={{ textAlign: "right" }}>Closing balance</th>
                          <th>Lines</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementsQuery.data.map((stmt) => (
                          <tr key={stmt.id}>
                            <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                              {stmt.accountId}
                            </td>
                            <td>{stmt.statementDate}</td>
                            <td>{stmt.currency}</td>
                            <td className="num-cell">
                              {formatMoney(stmt.closingBalance, stmt.currency)}
                            </td>
                            <td>{stmt.lineCount} lines</td>
                            <td>
                              <span
                                className={`badge ${
                                  stmt.status === "reconciled" ? "badge-mint" : "badge-amber"
                                }`}
                              >
                                {stmt.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state-box">
                    <FileText size={32} className="empty-state-icon" />
                    <p>Imported statements will appear here.</p>
                  </div>
                )}
              </div>

              {/* Agent Activity Card */}
              <div className="agent-activity-banner">
                <div className="agent-activity-left">
                  <Activity size={18} color="#2E7D68" />
                  <div>
                    <div className="agent-activity-title">
                      Agent activity
                      <span className="badge badge-mint">TA-01 Reconciler Active</span>
                    </div>
                    <div className="agent-activity-subtitle">
                      {agentRunsQuery.data?.[0]
                        ? `Last run completed with ${agentRunsQuery.data[0].proposalCount} proposals generated`
                        : "Ready to analyze incoming statement transactions"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="agent-activity-link"
                  onClick={() => setPage("Agent activity")}
                >
                  <span>View activity</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Column (1/3): How this is calculated */}
            <div className="calculation-card">
              <h2>How this is calculated</h2>

              <div className="calc-formula-box">
                <span className="calc-formula-tag">Available cash</span>
                <span className="calc-formula-text">Bank cash — restricted cash</span>
                <span className="calc-formula-note">
                  Reservations are deducted only when not already reflected in the source balance.
                </span>
              </div>

              <div className="evidence-section">
                <span className="evidence-title">Required evidence</span>
                <ul className="evidence-list">
                  <li className="evidence-item">
                    <span className="evidence-circle verified" />
                    <span>Bank balance</span>
                  </li>
                  <li className="evidence-item">
                    <span className="evidence-circle verified" />
                    <span>Restriction records</span>
                  </li>
                  <li className="evidence-item">
                    <span className="evidence-circle verified" />
                    <span>Source timestamp</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="calc-metric-link"
                onClick={() => setShowMetricModal(true)}
              >
                <span>View metric definition</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------------------
          CASH & LIQUIDITY SCREEN
          -------------------------------------------------------------------- */}
      {page === "Cash & liquidity" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Cash positions & accounts</h2>
                <span className="header-context">
                  Exact decimal consolidated balances and segregated restricted holds.
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  className="filter-select"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {cashPos && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "14px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Bank Cash</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                    {formatMoney(cashPos.bankCash, cashPos.currency)}
                  </div>
                </div>
                <div style={{ padding: "14px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Restricted Cash</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--coral)", fontFamily: "var(--font-heading)" }}>
                    {formatMoney(cashPos.restrictedCash, cashPos.currency)}
                  </div>
                </div>
                <div style={{ padding: "14px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Available Liquidity</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--mint)", fontFamily: "var(--font-heading)" }}>
                    {formatMoney(cashPos.availableCash, cashPos.currency)}
                  </div>
                </div>
                <div style={{ padding: "14px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Undrawn Facilities</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--blue)", fontFamily: "var(--font-heading)" }}>
                    {formatMoney(cashPos.undrawnFacilities, cashPos.currency)}
                  </div>
                </div>
              </div>
            )}

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Account number / IBAN</th>
                    <th>Bank</th>
                    <th>Currency</th>
                    <th style={{ textAlign: "right" }}>Reported balance</th>
                    <th style={{ textAlign: "right" }}>Restricted hold</th>
                    <th style={{ textAlign: "right" }}>Available cash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cashPos?.accounts.map((acc) => (
                    <tr key={acc.accountId}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {acc.accountNumber}
                      </td>
                      <td>{acc.bankName}</td>
                      <td>{acc.currency}</td>
                      <td className="num-cell">{formatMoney(acc.bankBalance, acc.currency)}</td>
                      <td className="num-cell" style={{ color: "var(--coral)" }}>
                        {formatMoney(acc.restrictedHold, acc.currency)}
                      </td>
                      <td className="num-cell" style={{ color: "var(--mint)" }}>
                        {formatMoney(acc.availableCash, acc.currency)}
                      </td>
                      <td>
                        <span className="badge badge-mint">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          RECONCILIATION SCREEN
          -------------------------------------------------------------------- */}
      {page === "Reconciliation" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Statement reconciliation workspace</h2>
                <span className="header-context">
                  CAMT.053 / MT940 statement match proposals and exceptions review.
                </span>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowImportModal(true)}
              >
                <Upload size={15} />
                <span>Import statement</span>
              </button>
            </div>

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Statement ID</th>
                    <th>Account</th>
                    <th>Date</th>
                    <th>Opening</th>
                    <th>Closing</th>
                    <th>Lines</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {statementsQuery.data?.map((stmt) => (
                    <tr key={stmt.id}>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{stmt.id}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {stmt.accountId}
                      </td>
                      <td>{stmt.statementDate}</td>
                      <td className="num-cell">{formatMoney(stmt.openingBalance, stmt.currency)}</td>
                      <td className="num-cell">{formatMoney(stmt.closingBalance, stmt.currency)}</td>
                      <td>{stmt.lineCount}</td>
                      <td>
                        <span
                          className={`badge ${
                            stmt.status === "reconciled" ? "badge-mint" : "badge-amber"
                          }`}
                        >
                          {stmt.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => alert(`Reviewing statement ${stmt.id} matching lines.`)}
                        >
                          Review lines
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          APPROVALS INBOX SCREEN
          -------------------------------------------------------------------- */}
      {page === "Approvals" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Maker-checker approval inbox</h2>
                <span className="header-context">
                  Dual-control governance. Financial actions require authorized checker confirmation.
                </span>
              </div>
            </div>

            {approvalsQuery.data && approvalsQuery.data.length > 0 ? (
              <div className="treasury-table-wrapper">
                <table className="treasury-table">
                  <thead>
                    <tr>
                      <th>Action type</th>
                      <th>Entity</th>
                      <th>Maker</th>
                      <th>Payload details</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Decisions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsQuery.data.map((appr) => {
                      const isPending = appr.status === "pending";
                      return (
                        <tr key={appr.id}>
                          <td style={{ fontWeight: 600 }}>{appr.actionType}</td>
                          <td>{appr.entityId}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                            {appr.makerId}
                          </td>
                          <td>
                            <pre
                              style={{
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                background: "var(--mineral)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                margin: 0,
                              }}
                            >
                              {JSON.stringify(appr.payloadSummary, null, 1)}
                            </pre>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                appr.status === "approved"
                                  ? "badge-mint"
                                  : appr.status === "rejected"
                                  ? "badge-coral"
                                  : "badge-amber"
                              }`}
                            >
                              {appr.status}
                            </span>
                          </td>
                          <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(appr.expiresAt).toLocaleDateString()}
                          </td>
                          <td>
                            {isPending ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ padding: "5px 10px", fontSize: "11px" }}
                                  onClick={async () => {
                                    try {
                                      await api(`/v1/approvals/${appr.id}/decisions`, {
                                        method: "POST",
                                        body: JSON.stringify({
                                          decision: "approved",
                                          notes: "Approved via dual control review",
                                        }),
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["approvals"] });
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: "5px 10px", fontSize: "11px", color: "var(--coral)" }}
                                  onClick={async () => {
                                    try {
                                      await api(`/v1/approvals/${appr.id}/decisions`, {
                                        method: "POST",
                                        body: JSON.stringify({
                                          decision: "rejected",
                                          notes: "Rejected by checker",
                                        }),
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["approvals"] });
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Finalized
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <CheckCircle2 size={32} color="var(--mint)" />
                <p>No pending approvals. All maker requests have been decided.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          COLLECTIONS & SETTLEMENTS SCREEN
          -------------------------------------------------------------------- */}
      {page === "Collections & settlements" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Payment gateway collections & payouts</h2>
                <span className="header-context">
                  Normalized provider tracking (Stripe, Telr, Amazon Payment Services) and bank payout matching.
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Stripe Treasury</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Merchant: acct_stripe_uae_01 (Test mode)
                </div>
                <div style={{ marginTop: "12px", fontSize: "13px" }}>
                  Status: <span className="badge badge-mint">Active</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Telr Gateway</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Merchant: telr_uae_mcht_99 (Connected)
                </div>
                <div style={{ marginTop: "12px", fontSize: "13px" }}>
                  Status: <span className="badge badge-mint">Active</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Amazon Payment Services</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Merchant: aps_enterprise_01 (Standby)
                </div>
                <div style={{ marginTop: "12px", fontSize: "13px" }}>
                  Status: <span className="badge badge-neutral">Standby</span>
                </div>
              </div>
            </div>

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Merchant account</th>
                    <th>Gross</th>
                    <th>Fee</th>
                    <th>Net settlement</th>
                    <th>Settlement currency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionsQuery.data?.map((col) => (
                    <tr key={col.id}>
                      <td style={{ fontWeight: 600, textTransform: "capitalize" }}>{col.provider}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{col.merchantAccountId}</td>
                      <td className="num-cell">{formatMoney(col.grossAmount, col.originalCurrency)}</td>
                      <td className="num-cell" style={{ color: "var(--coral)" }}>
                        {formatMoney(col.feeAmount, col.originalCurrency)}
                      </td>
                      <td className="num-cell" style={{ color: "var(--mint)" }}>
                        {formatMoney(col.netSettlementAmount, col.settlementCurrency)}
                      </td>
                      <td>{col.settlementCurrency}</td>
                      <td>
                        <span className="badge badge-mint">{col.normalizedStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          OUTBOUND PAYMENTS SCREEN
          -------------------------------------------------------------------- */}
      {page === "Outbound payments" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Outbound payment requests</h2>
                <span className="header-context">
                  Controlled corporate disbursements with maker-checker approvals and beneficiary validation.
                </span>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowNewPaymentModal(true)}
              >
                <Plus size={15} />
                <span>New payment request</span>
              </button>
            </div>

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>IBAN</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Maker</th>
                    <th>Approval status</th>
                    <th>Execution status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsQuery.data?.map((pmt) => (
                    <tr key={pmt.id}>
                      <td style={{ fontWeight: 600 }}>{pmt.beneficiaryName}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{pmt.beneficiaryIban}</td>
                      <td className="num-cell">{formatMoney(pmt.amount, pmt.currency)}</td>
                      <td>{pmt.currency}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{pmt.makerId}</td>
                      <td>
                        <span
                          className={`badge ${
                            pmt.approvalStatus === "approved"
                              ? "badge-mint"
                              : pmt.approvalStatus === "pending"
                              ? "badge-amber"
                              : "badge-coral"
                          }`}
                        >
                          {pmt.approvalStatus}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{pmt.executionStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          ESCROW MONITORING SCREEN
          -------------------------------------------------------------------- */}
      {page === "Escrow monitoring" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Escrow & restricted project accounts</h2>
                <span className="header-context">
                  Project account balances, legal restrictions, and maker-checker release governance.
                </span>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowNewEscrowModal(true)}
              >
                <Plus size={15} />
                <span>Request escrow release</span>
              </button>
            </div>

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Project name</th>
                    <th>Escrow account</th>
                    <th>Currency</th>
                    <th style={{ textAlign: "right" }}>Reported balance</th>
                    <th style={{ textAlign: "right" }}>Restricted amount</th>
                    <th style={{ textAlign: "right" }}>Available for release</th>
                    <th>As of</th>
                  </tr>
                </thead>
                <tbody>
                  {escrowAccountsQuery.data?.map((esc) => (
                    <tr key={esc.id}>
                      <td style={{ fontWeight: 600 }}>{esc.projectName}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{esc.bankAccountId}</td>
                      <td>{esc.currency}</td>
                      <td className="num-cell">{formatMoney(esc.reportedBalance, esc.currency)}</td>
                      <td className="num-cell" style={{ color: "var(--coral)" }}>
                        {formatMoney(esc.restrictedAmount, esc.currency)}
                      </td>
                      <td className="num-cell" style={{ color: "var(--mint)" }}>
                        {formatMoney(esc.availableForRelease, esc.currency)}
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>{esc.asOf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          REPORTS SCREEN
          -------------------------------------------------------------------- */}
      {page === "Reports" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Treasury reports & exports</h2>
                <span className="header-context">
                  Audited reports with exact timestamps, source lineage, and control totals.
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--mineral)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <FileSpreadsheet size={24} color="#315B58" />
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Cash Position Report</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Consolidated bank balances, restricted cash segregations, and net operating liquidity.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "auto" }}
                  onClick={() => downloadCsv("/v1/reports/cash-position.csv", "cash-position-report.csv")}
                >
                  <Download size={15} />
                  <span>Download CSV</span>
                </button>
              </div>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--mineral)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <AlertTriangle size={24} color="#D97706" />
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Reconciliation Exceptions Report</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Unmatched statement lines, timing differences, and settlement variance logs.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ alignSelf: "flex-start", marginTop: "auto" }}
                  onClick={() => downloadCsv("/v1/reports/exceptions.csv", "reconciliation-exceptions.csv")}
                >
                  <Download size={15} />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          AGENT ACTIVITY SCREEN
          -------------------------------------------------------------------- */}
      {page === "Agent activity" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Autonomous agent run logs & evidence</h2>
                <span className="header-context">
                  TA-01 Reconciler run history, proposed matches, and supporting evidence lineage.
                </span>
              </div>
            </div>

            <div className="treasury-table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Agent</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Proposals generated</th>
                    <th>Evidence items</th>
                    <th>Started at</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRunsQuery.data?.map((run) => (
                    <tr key={run.id}>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{run.id}</td>
                      <td style={{ fontWeight: 600 }}>{run.agentId}</td>
                      <td>{run.runType}</td>
                      <td>
                        <span className="badge badge-mint">{run.status}</span>
                      </td>
                      <td>{run.proposalCount}</td>
                      <td>{run.evidenceCount} items</td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          CONNECTIONS SCREEN
          -------------------------------------------------------------------- */}
      {page === "Connections" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Treasury system & banking connectors</h2>
                <span className="header-context">
                  Integration gateways for TMS, Host-to-Host banking feeds, and payment service providers.
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {connectorsQuery.data?.map((conn) => (
                <div
                  key={conn.id}
                  style={{
                    padding: "20px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--mineral)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{conn.name}</h3>
                    <span
                      className={`badge ${
                        conn.status === "connected"
                          ? "badge-mint"
                          : conn.status === "test_mode"
                          ? "badge-amber"
                          : "badge-neutral"
                      }`}
                    >
                      {conn.status.replace("_", " ")}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Type: {conn.type.toUpperCase()}
                  </p>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Last sync: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : "Never"}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: "auto", fontSize: "12px" }}
                    onClick={() => alert(`Connector ${conn.name} status: ${conn.status}`)}
                  >
                    Configure connector
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          SETTINGS SCREEN
          -------------------------------------------------------------------- */}
      {page === "Settings" && (
        <div className="overview-left">
          <div className="overview-card">
            <div className="overview-card-header">
              <div>
                <h2>Workspace settings & security</h2>
                <span className="header-context">
                  Active tenant metadata, token expiration safeguards, and role-based policies.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "16px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>Tenant Membership</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Tenant ID: <code style={{ fontFamily: "var(--font-mono)" }}>tenant-northstar-group</code>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Active User: <code style={{ fontFamily: "var(--font-mono)" }}>admin@treasury.local</code> (Role: Platform Admin)
                </div>
              </div>

              <div style={{ padding: "16px", background: "var(--mineral)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>Session & Token Security</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Token Lifetime: 15 minutes (auto-refreshes on user activity)
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Single-use OTP Challenge: Enforced
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Production Fail-Closed Controls: Active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL: STATEMENT IMPORT
          -------------------------------------------------------------------- */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Bank Statement</h2>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setShowImportModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await api("/v1/statements/import", {
                    method: "POST",
                    body: JSON.stringify({
                      entityId: formData.get("entityId"),
                      accountId: formData.get("accountId"),
                      statementDate: formData.get("statementDate"),
                      currency: formData.get("currency"),
                      openingBalance: formData.get("openingBalance"),
                      closingBalance: formData.get("closingBalance"),
                      lines: [
                        {
                          id: `line-${Date.now()}-1`,
                          bookingDate: formData.get("statementDate"),
                          valueDate: formData.get("statementDate"),
                          amount: "25000.00",
                          currency: formData.get("currency"),
                          creditDebit: "CR",
                          remittanceInfo: "Customer Payment INV-9021",
                          reference: `REF-${Date.now()}`,
                        },
                      ],
                    }),
                  });
                  queryClient.invalidateQueries({ queryKey: ["statements"] });
                  queryClient.invalidateQueries({ queryKey: ["cash-positions"] });
                  setShowImportModal(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label>Legal Entity</label>
                  <select name="entityId" className="filter-select" required>
                    <option value="le-northstar-ae">Northstar UAE Ltd</option>
                    <option value="le-northstar-difc">Northstar Treasury DIFC</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bank Account Number / IBAN</label>
                  <input
                    name="accountId"
                    type="text"
                    required
                    defaultValue="AE0303300000001234567"
                    className="filter-select"
                  />
                </div>

                <div className="form-group">
                  <label>Statement Date</label>
                  <input
                    name="statementDate"
                    type="date"
                    required
                    defaultValue="2026-09-10"
                    className="filter-select"
                  />
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select name="currency" className="filter-select" required>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Opening Balance</label>
                    <input
                      name="openingBalance"
                      type="text"
                      required
                      defaultValue="15000000.00"
                      className="filter-select"
                    />
                  </div>
                  <div className="form-group">
                    <label>Closing Balance</label>
                    <input
                      name="closingBalance"
                      type="text"
                      required
                      defaultValue="15025000.00"
                      className="filter-select"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Import Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL: METRIC DEFINITIONS & FORMULAS
          -------------------------------------------------------------------- */}
      {showMetricModal && (
        <div className="modal-overlay" onClick={() => setShowMetricModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Treasury Metric Definitions</h2>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setShowMetricModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="calc-formula-box">
                <span className="calc-formula-tag">Available Cash Formula</span>
                <span className="calc-formula-text">Available Cash = Bank Cash — Restricted Cash — Reservations</span>
                <span className="calc-formula-note">
                  Operating cash ready for disbursement. Restricted funds (e.g. escrow accounts or legal holds)
                  are subtracted to prevent double-counting.
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Bank Cash</h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Total verified bank-reported balances across operating and escrow accounts as of the latest statement timestamp.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Restricted Cash</h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Balances segregated under legal, regulatory, or escrow agreements (e.g., project escrow accounts).
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Undrawn Facilities</h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Committed credit and overdraft headroom. Tracked distinctly from operating cash.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowMetricModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL: NEW OUTBOUND PAYMENT REQUEST
          -------------------------------------------------------------------- */}
      {showNewPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowNewPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Outbound Payment Request</h2>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setShowNewPaymentModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await api("/v1/payments/outbound", {
                    method: "POST",
                    body: JSON.stringify({
                      entityId: formData.get("entityId"),
                      bankAccountId: formData.get("bankAccountId"),
                      beneficiaryName: formData.get("beneficiaryName"),
                      beneficiaryIban: formData.get("beneficiaryIban"),
                      amount: formData.get("amount"),
                      currency: formData.get("currency"),
                      reason: formData.get("reason"),
                    }),
                  });
                  queryClient.invalidateQueries({ queryKey: ["outbound-payments"] });
                  queryClient.invalidateQueries({ queryKey: ["approvals"] });
                  setShowNewPaymentModal(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label>Legal Entity</label>
                  <select name="entityId" className="filter-select" required>
                    <option value="le-northstar-ae">Northstar UAE Ltd</option>
                    <option value="le-northstar-difc">Northstar Treasury DIFC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Source Bank Account</label>
                  <input
                    name="bankAccountId"
                    type="text"
                    required
                    defaultValue="ba-enbd-ae-01"
                    className="filter-select"
                  />
                </div>
                <div className="form-group">
                  <label>Beneficiary Name</label>
                  <input
                    name="beneficiaryName"
                    type="text"
                    required
                    placeholder="e.g. Al Futtaim Engineering LLC"
                    className="filter-select"
                  />
                </div>
                <div className="form-group">
                  <label>Beneficiary IBAN</label>
                  <input
                    name="beneficiaryIban"
                    type="text"
                    required
                    placeholder="AE..."
                    className="filter-select"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      name="amount"
                      type="text"
                      required
                      placeholder="50000.00"
                      className="filter-select"
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" className="filter-select" required>
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Reason / Purpose of Payment</label>
                  <input
                    name="reason"
                    type="text"
                    required
                    placeholder="Supplier invoice payment"
                    className="filter-select"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL: NEW ESCROW RELEASE REQUEST
          -------------------------------------------------------------------- */}
      {showNewEscrowModal && (
        <div className="modal-overlay" onClick={() => setShowNewEscrowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Escrow Disbursement</h2>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setShowNewEscrowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await api("/v1/escrow/releases", {
                    method: "POST",
                    body: JSON.stringify({
                      entityId: formData.get("entityId"),
                      escrowAccountId: formData.get("escrowAccountId"),
                      requestedAmount: formData.get("requestedAmount"),
                      currency: formData.get("currency"),
                      reason: formData.get("reason"),
                    }),
                  });
                  queryClient.invalidateQueries({ queryKey: ["escrow-releases"] });
                  queryClient.invalidateQueries({ queryKey: ["approvals"] });
                  setShowNewEscrowModal(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label>Legal Entity</label>
                  <select name="entityId" className="filter-select" required>
                    <option value="le-northstar-ae">Northstar UAE Ltd</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Escrow Account</label>
                  <select name="escrowAccountId" className="filter-select" required>
                    <option value="escrow-dxb-01">Dubai Marina Tower Escrow (escrow-dxb-01)</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Requested Amount</label>
                    <input
                      name="requestedAmount"
                      type="text"
                      required
                      placeholder="100000.00"
                      className="filter-select"
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" className="filter-select" required>
                      <option value="AED">AED</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Milestone / Justification</label>
                  <input
                    name="reason"
                    type="text"
                    required
                    placeholder="Milestone 4 Completion Certificate verified by engineering consultant"
                    className="filter-select"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewEscrowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Release Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ObsidianDashboard>
  );
}
