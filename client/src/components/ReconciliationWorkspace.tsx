import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { Statement } from "../types";
import { formatMoney } from "../utils/money";

interface ReconciliationWorkspaceProps {
  statements: Statement[];
  loading: boolean;
  onImport: () => void;
}

type BatchFilter = "all" | "review" | "reconciled";

function isReconciled(status: string): boolean {
  return status.toLowerCase() === "reconciled";
}

function readableStatus(status: string): string {
  return status.replaceAll("_", " ");
}

export function ReconciliationWorkspace({
  statements,
  loading,
  onImport,
}: ReconciliationWorkspaceProps) {
  const [filter, setFilter] = useState<BatchFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(statements[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId && statements.length > 0) setSelectedId(statements[0].id);
    if (selectedId && !statements.some((statement) => statement.id === selectedId)) {
      setSelectedId(statements[0]?.id ?? null);
    }
  }, [selectedId, statements]);

  const summary = useMemo(
    () => ({
      batches: statements.length,
      lines: statements.reduce((total, statement) => total + statement.lineCount, 0),
      review: statements.filter((statement) => !isReconciled(statement.status)).length,
      reconciled: statements.filter((statement) => isReconciled(statement.status)).length,
    }),
    [statements],
  );

  const visibleStatements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return statements.filter((statement) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "reconciled" && isReconciled(statement.status)) ||
        (filter === "review" && !isReconciled(statement.status));
      const matchesQuery =
        !normalizedQuery ||
        [statement.id, statement.accountId, statement.entityId, statement.source]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, statements]);

  const selected = statements.find((statement) => statement.id === selectedId) ?? null;

  return (
    <section className="reconciliation-page" aria-labelledby="reconciliation-title">
      <header className="reconciliation-hero">
        <div>
          <div className="eyebrow">Controlled bank data intake</div>
          <h1 id="reconciliation-title">Bank imports and reconciliation</h1>
          <p>
            Validate source files, investigate exceptions and preserve maker-checker evidence before
            a batch is committed.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onImport}>
          <Upload size={16} />
          <span>Import statement</span>
        </button>
      </header>

      <div className="control-notice" role="note">
        <ShieldCheck size={17} />
        <span>
          Human controlled. Agent recommendations explain evidence but cannot release payments,
          post journals or approve their own proposals.
        </span>
      </div>

      <div className="import-kpi-grid" aria-label="Import control summary">
        <article className="import-kpi">
          <span>Imported batches</span>
          <strong>{summary.batches}</strong>
          <small>Authorized entity scope</small>
        </article>
        <article className="import-kpi">
          <span>Statement lines</span>
          <strong>{summary.lines}</strong>
          <small>Source-reported records</small>
        </article>
        <article className="import-kpi attention">
          <span>Needs review</span>
          <strong>{summary.review}</strong>
          <small>Not yet reconciled</small>
        </article>
        <article className="import-kpi healthy">
          <span>Reconciled</span>
          <strong>{summary.reconciled}</strong>
          <small>Control state complete</small>
        </article>
      </div>

      <div className="reconciliation-workbench">
        <aside className="workflow-rail" aria-label="Reconciliation workflow and filters">
          <div className="pane-heading">
            <span>Control workflow</span>
            <small>Server authoritative</small>
          </div>

          <ol className="workflow-steps">
            <li className="complete">
              <span className="step-marker"><CheckCircle2 size={14} /></span>
              <div><strong>Upload</strong><small>Private source file</small></div>
            </li>
            <li className="complete">
              <span className="step-marker"><FileCheck2 size={14} /></span>
              <div><strong>Validate</strong><small>Schema and control totals</small></div>
            </li>
            <li className="active">
              <span className="step-marker"><FileSearch size={14} /></span>
              <div><strong>Reconcile</strong><small>Evidence-based proposals</small></div>
            </li>
            <li>
              <span className="step-marker"><LockKeyhole size={14} /></span>
              <div><strong>Checker sign-off</strong><small>Segregation of duties</small></div>
            </li>
          </ol>

          <div className="rail-divider" />
          <div className="pane-heading"><span>Batch views</span></div>
          <div className="batch-filters">
            {([
              ["all", "All batches", summary.batches],
              ["review", "Needs review", summary.review],
              ["reconciled", "Reconciled", summary.reconciled],
            ] as const).map(([value, label, count]) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                <span>{label}</span><strong>{count}</strong>
              </button>
            ))}
          </div>
        </aside>

        <div className="batch-pane">
          <div className="batch-toolbar">
            <div>
              <h2>Statement batches</h2>
              <p>Select a batch to inspect its source evidence.</p>
            </div>
            <label className="batch-search">
              <Search size={14} />
              <span className="sr-only">Search statement batches</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search batch or account"
              />
            </label>
          </div>

          {loading ? (
            <div className="workbench-empty">Loading authorized statement batches…</div>
          ) : visibleStatements.length === 0 ? (
            <div className="workbench-empty">
              <FileSearch size={30} />
              <strong>No statement batches found</strong>
              <span>Import a source file or change the active filter.</span>
              <button type="button" className="btn-secondary" onClick={onImport}>Import a file</button>
            </div>
          ) : (
            <div className="treasury-table-wrapper workbench-table">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Closing balance</th>
                    <th>Lines</th>
                    <th>Status</th>
                    <th><span className="sr-only">Inspect</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStatements.map((statement) => (
                    <tr
                      key={statement.id}
                      className={selected?.id === statement.id ? "selected-row" : ""}
                      onClick={() => setSelectedId(statement.id)}
                    >
                      <td>
                        <button
                          type="button"
                          className="batch-id-button"
                          onClick={() => setSelectedId(statement.id)}
                        >
                          <strong>{statement.id}</strong>
                          <small>{statement.accountId}</small>
                        </button>
                      </td>
                      <td>{statement.statementDate}</td>
                      <td className="num-cell">{formatMoney(statement.closingBalance, statement.currency)}</td>
                      <td>{statement.lineCount}</td>
                      <td>
                        <span className={`badge ${isReconciled(statement.status) ? "badge-mint" : "badge-amber"}`}>
                          {readableStatus(statement.status)}
                        </span>
                      </td>
                      <td><ArrowRight size={15} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="evidence-pane" aria-live="polite">
          <div className="pane-heading">
            <span>Source evidence</span>
            <small>Read only</small>
          </div>

          {selected ? (
            <>
              <div className="evidence-batch-title">
                <div className="evidence-icon"><Fingerprint size={19} /></div>
                <div><strong>{selected.id}</strong><small>{selected.source}</small></div>
              </div>

              <dl className="evidence-facts">
                <div><dt>Legal entity</dt><dd>{selected.entityId}</dd></div>
                <div><dt>Bank account</dt><dd>{selected.accountId}</dd></div>
                <div><dt>Statement date</dt><dd>{selected.statementDate}</dd></div>
                <div><dt>Opening balance</dt><dd>{formatMoney(selected.openingBalance, selected.currency)}</dd></div>
                <div><dt>Closing balance</dt><dd>{formatMoney(selected.closingBalance, selected.currency)}</dd></div>
                <div><dt>Imported at</dt><dd>{new Date(selected.importedAt).toLocaleString()}</dd></div>
              </dl>

              <div className="evidence-control-card">
                <span>Integrity fingerprint</span>
                <code title={selected.checksum}>{selected.checksum.slice(0, 18)}…</code>
                <small>Generated from the imported source and retained for duplicate control.</small>
              </div>

              <div className="agent-boundary-card">
                <ShieldCheck size={17} />
                <div>
                  <strong>Evidence before recommendation</strong>
                  <p>No agent fact is displayed unless it is supported by this batch or an approved policy source.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="workbench-empty compact">
              <FileSearch size={28} />
              <strong>Select a batch</strong>
              <span>Its immutable source evidence will appear here.</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
