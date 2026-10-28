import { useState } from "react";
import type { Dashboard, DataSource, Warning } from "../domain/models";
import { Sheet } from "../components/Sheet";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import { WarningDetails } from "./DashboardView";

export function SourceDetails({
  source,
  onClose,
}: {
  source: DataSource;
  onClose: () => void;
}) {
  return (
    <Sheet
      title={source.name}
      eyebrow="Source evidence"
      onClose={onClose}
      footer={
        <button className="secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="stack">
        <Badge status={source.status === "valid" ? "on-track" : "watch"}>
          {source.status.replaceAll("-", " ")}
        </Badge>
        <p>
          {source.isSample
            ? "Fictional sample data"
            : "Local upload · unverified business information"}{" "}
          · {source.type.toUpperCase()}
        </p>
        <p>
          {source.rowCount} rows · {source.fieldNames.length} fields
        </p>
        <p>
          Source period:{" "}
          {source.period
            ? `${source.period.start} – ${source.period.end}`
            : "Unknown; confirm a date mapping before calculation."}
        </p>
        <p>Imported {new Date(source.uploadedAt).toLocaleString()}</p>
        {source.selectedSheet && <p>Sheet: {source.selectedSheet}</p>}
        <p>Freshness: {source.freshness}. Check dates before acting.</p>
        {source.warnings.length > 0 && (
          <section className="notice">
            <h3>Data quality</h3>
            {source.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </section>
        )}
        <section>
          <h3>Original fields</h3>
          <p>{source.fieldNames.join(", ")}</p>
        </section>
        <section>
          <h3>Row preview</h3>
          <p>
            First {Math.min(20, source.rows.length)} of {source.rowCount} rows.
            Original files are not retained as downloadable copies.
          </p>
          <div className="stack">
            {source.rows.slice(0, 20).map((row, i) => (
              <details className="notice" key={i}>
                <summary>Data row {i + 1}</summary>
                <dl>
                  {source.fieldNames.map((field) => (
                    <div key={field}>
                      <dt>
                        <strong>{field}</strong>
                      </dt>
                      <dd
                        style={{
                          marginInlineStart: 0,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {row[field] === null ||
                        row[field] === undefined ||
                        row[field] === ""
                          ? "Missing"
                          : String(row[field])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
export function SourcesView({
  sources,
  onDelete,
  onReplace,
}: {
  sources: DataSource[];
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File) => Promise<void>;
}) {
  const [selected, setSelected] = useState<DataSource | null>(null),
    [deleting, setDeleting] = useState<DataSource | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<string | null>(null);
  async function replace(source: DataSource, file: File) {
    setBusy(source.id);
    setError("");
    try {
      await onReplace(source.id, file);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Replacement failed. The original source is unchanged. Try a smaller valid CSV or XLSX file.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="stack">
      <header className="page-heading">
        <p className="eyebrow">Your local workspace</p>
        <h1>Data sources</h1>
        <p className="subtitle">The files behind your decisions.</p>
      </header>
      <div className="notice">
        <strong>Fictional or anonymized data only.</strong>
        <p>
          Files are parsed in this browser. Replacing a source updates the
          linked dashboards and requires mapping review. Deleting a source makes
          its dependent KPIs unavailable.
        </p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!sources.length ? (
        <section className="panel">
          <h2>No sources yet</h2>
          <p>
            Create a dashboard with the + action to load sample data or upload a
            CSV or XLSX file.
          </p>
        </section>
      ) : (
        sources.map((s) => (
          <article className="panel stack" key={s.id}>
            <div className="source-row">
              <span className="file-icon">
                <Icon name="file" />
              </span>
              <div>
                <strong>{s.name}</strong>
                <p>
                  {s.rowCount} rows · {s.fieldNames.length} fields ·{" "}
                  {s.type.toUpperCase()}
                </p>
                <Badge
                  status={
                    s.isSample
                      ? "sample"
                      : s.status === "valid"
                        ? "on-track"
                        : "watch"
                  }
                >
                  {s.isSample
                    ? "Fictional sample"
                    : s.status.replaceAll("-", " ")}
                </Badge>
              </div>
            </div>
            {s.period && (
              <p>
                {s.period.start} – {s.period.end}
              </p>
            )}
            {s.warnings.length > 0 && (
              <p className="notice">
                {s.warnings.length} data-quality notes. Review the source before
                calculating.
              </p>
            )}
            <div className="actions">
              <button className="secondary" onClick={() => setSelected(s)}>
                Inspect source
              </button>
              <button
                className="danger"
                onClick={() => setDeleting(s)}
                aria-label={`Delete ${s.name}`}
              >
                <Icon name="trash" /> Delete
              </button>
            </div>
            <label className="field">
              {busy === s.id ? "Replacing source…" : "Replace with CSV or XLSX"}
              <input
                type="file"
                accept=".csv,.xlsx"
                disabled={busy !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void replace(s, file);
                  e.target.value = "";
                }}
              />
            </label>
            <small>
              Maximum 2 MB and 5,000 rows. Review mappings after replacing.
            </small>
          </article>
        ))
      )}
      {selected && (
        <SourceDetails
          source={sources.find((s) => s.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
        />
      )}{" "}
      {deleting && (
        <Sheet
          title="Delete this source?"
          eyebrow="Local data control"
          onClose={() => setDeleting(null)}
          footer={
            <div className="actions">
              <button className="secondary" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                className="danger"
                onClick={() => {
                  onDelete(deleting.id);
                  setDeleting(null);
                }}
              >
                Delete source
              </button>
            </div>
          }
        >
          <p>
            Delete <strong>{deleting.name}</strong> and its parsed rows from the
            workspace. Linked KPI results will become unavailable until you
            provide and confirm a replacement. Other sources and dashboards
            remain.
          </p>
        </Sheet>
      )}
    </div>
  );
}
export function AlertsView({
  dashboards,
  onReviewSource,
}: {
  dashboards: Dashboard[];
  onReviewSource: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Warning | null>(null);
  const rank = { high: 0, medium: 1, low: 2 };
  const warnings = dashboards
    .flatMap((d) => d.warnings.map((w) => ({ dashboard: d, warning: w })))
    .sort((a, b) => rank[a.warning.priority] - rank[b.warning.priority]);
  return (
    <div className="stack">
      <header className="page-heading">
        <p className="eyebrow">Important changes</p>
        <h1>Alerts</h1>
        <p className="subtitle">Evidence first. Your judgment always.</p>
      </header>
      <p>
        {warnings.length} rule-based warnings across {dashboards.length} saved
        dashboards.
      </p>
      {!warnings.length && (
        <section className="panel">
          <h2>No warnings to review</h2>
          <p>
            Create a dashboard or adjust its reporting period to evaluate your
            selected targets.
          </p>
        </section>
      )}
      {warnings.map(({ dashboard: d, warning: w }) => (
        <article className="panel stack" key={`${d.id}-${w.id}`}>
          <Badge
            status={
              w.priority === "high"
                ? "critical"
                : w.priority === "medium"
                  ? "watch"
                  : "unavailable"
            }
          >
            {w.priority} priority
          </Badge>
          <h2>{w.title}</h2>
          <p>{w.explanation}</p>
          <p>
            {d.name} · {d.dateRange.start} – {d.dateRange.end}
          </p>
          <button className="secondary" onClick={() => setSelected(w)}>
            Review warning <Icon name="arrow" />
          </button>
        </article>
      ))}
      <div className="human-note">
        <strong>Warnings are signals, not decisions.</strong>
        <p>
          Rules compare confirmed inputs with targets. They cannot establish
          causation or make business recommendations on your behalf.
        </p>
      </div>
      {selected && (
        <WarningDetails
          warning={selected}
          onClose={() => setSelected(null)}
          onReviewSource={onReviewSource}
        />
      )}
    </div>
  );
}
export function SettingsView({
  theme,
  onTheme,
  onClear,
  storageMessage,
}: {
  theme: "light" | "dark" | "system";
  onTheme: (value: "light" | "dark" | "system") => void;
  onClear: () => void;
  storageMessage?: string;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="stack">
      <header className="page-heading">
        <p className="eyebrow">Make it yours</p>
        <h1>Settings</h1>
        <p className="subtitle">A workspace on your device.</p>
      </header>
      <section className="panel stack">
        <h2>Appearance</h2>
        <label className="field">
          Theme
          <select
            value={theme}
            onChange={(e) => onTheme(e.target.value as typeof theme)}
          >
            <option value="system">Follow device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>
      <section className="panel stack">
        <h2>Local workspace</h2>
        <p>
          Dashboards, confirmed mappings, and small parsed datasets are saved in
          this browser’s localStorage. They are available only on this device
          and browser, and may be lost if browser storage is cleared or evicted.
        </p>
        <p>
          Raw files are not retained as downloadable originals. Keep your own
          copies. Private browsing may prevent saving.
        </p>
        {storageMessage && (
          <p role="status" className="notice">
            {storageMessage}
          </p>
        )}
        <button className="danger" onClick={() => setConfirm(true)}>
          <Icon name="trash" /> Clear local workspace
        </button>
      </section>
      <section className="panel stack">
        <h2>Prototype privacy</h2>
        <div className="human-note">
          <strong>Do not upload confidential company data.</strong>
          <p>Use fictional or anonymized information only.</p>
        </div>
        <p>
          CSV and XLSX parsing, KPI calculations, mapping suggestions, and
          warning explanations run locally. No files are sent to an AI service,
          database, or backend.
        </p>
        <p>
          This prototype has no accounts, authentication, multi-user
          authorization, encrypted data storage, live synchronization, or
          production retention controls. It does not claim GDPR compliance.
        </p>
        <p>
          Local deterministic rules suggest mappings and explain calculated
          facts. There is no external AI model. You remain responsible for
          checking the evidence and making decisions.
        </p>
        <h3>Future privacy policy</h3>
        <p>
          A production privacy policy, consent controls, access controls, and
          retention/deletion processes must be defined before using real
          customer data.
        </p>
      </section>
      {confirm && (
        <Sheet
          title="Clear this workspace?"
          eyebrow="Local data control"
          onClose={() => setConfirm(false)}
          footer={
            <div className="actions">
              <button className="secondary" onClick={() => setConfirm(false)}>
                Keep workspace
              </button>
              <button
                className="danger"
                onClick={() => {
                  onClear();
                  setConfirm(false);
                }}
              >
                Delete all local data
              </button>
            </div>
          }
        >
          <p>
            This deletes all saved dashboards, source rows, mappings, and draft
            selections from this browser. You can load fictional samples again.
            This cannot restore your original uploaded files.
          </p>
        </Sheet>
      )}
    </div>
  );
}
