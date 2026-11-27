import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type {
  Dashboard,
  DateRange,
  KpiResult,
  SourceReference,
  Warning,
} from "../domain/models";
import { calculateKpi, formatMetric } from "../domain/calculations";
import { Sheet } from "../components/Sheet";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import { BusinessSummary } from "./BusinessSummary";
import { DashboardFilters } from "./DashboardFilters";

const statusNames: Record<string, string> = {
  "on-track": "On track",
  watch: "Watch",
  critical: "Needs attention",
  unavailable: "Needs review",
};
function rangeLabel(range: DateRange) {
  return `${range.start} – ${range.end}`;
}
function SourcesEvidence({
  references,
  onReviewSource,
}: {
  references: SourceReference[];
  onReviewSource: (id: string) => void;
}) {
  return (
    <div className="stack">
      {references.length === 0 ? (
        <p>No confirmed source supports this result.</p>
      ) : (
        references.map((r, i) => (
          <div className="notice" key={`${r.sourceId}-${r.field}-${i}`}>
            <strong>{r.sourceName}</strong>
            <p>
              Field: {r.field} → {r.inputName}
              {r.sheet ? ` · Sheet: ${r.sheet}` : ""}
            </p>
            <p>
              {rangeLabel(r.period)} · {r.rowCount} supporting rows
            </p>
            <button
              className="text-button"
              onClick={() => onReviewSource(r.sourceId)}
            >
              Review source <Icon name="arrow" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
export function WarningDetails({
  warning,
  onClose,
  onReviewSource,
}: {
  warning: Warning;
  onClose: () => void;
  onReviewSource: (id: string) => void;
}) {
  return (
    <Sheet
      title={warning.title}
      eyebrow="Prioritized warning"
      onClose={onClose}
      footer={
        <button className="secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="stack">
        <Badge
          status={
            warning.priority === "high"
              ? "critical"
              : warning.priority === "medium"
                ? "watch"
                : "unavailable"
          }
        >
          {warning.priority} priority
        </Badge>
        <p>{warning.explanation}</p>
        <section>
          <h3>What changed</h3>
          {warning.changedValues.map((v, i) => (
            <p key={i}>{v}</p>
          ))}
          <p>
            <strong>Rule:</strong> {warning.ruleKey.replaceAll("-", " ")}
          </p>
        </section>
        {warning.impact && (
          <section>
            <h3>Potential impact</h3>
            <p>{warning.impact}</p>
          </section>
        )}
        <section>
          <h3>Source evidence</h3>
          <SourcesEvidence
            references={warning.sourceReferences}
            onReviewSource={(id) => {
              onClose();
              onReviewSource(id);
            }}
          />
        </section>
        <section>
          <h3>Limitations</h3>
          {warning.caveats.length ? (
            warning.caveats.map((x, i) => <p key={i}>{x}</p>)
          ) : (
            <p>
              The rule identifies a deviation, not its cause. Verify the source
              before acting.
            </p>
          )}
        </section>
        {warning.possibleNextStep && (
          <div className="human-note">
            <h3>Possible next step</h3>
            <p>{warning.possibleNextStep}</p>
          </div>
        )}
        <p>
          You remain responsible for the decision. No external AI analysis was
          used.
        </p>
      </div>
    </Sheet>
  );
}
function KpiEvidence({
  result,
  dashboard,
  onClose,
  onReviewSource,
}: {
  result: KpiResult;
  dashboard: Dashboard;
  onClose: () => void;
  onReviewSource: (id: string) => void;
}) {
  const def = dashboard.definitions.find((k) => k.id === result.kpiId);
  return (
    <Sheet
      title={result.name}
      eyebrow="KPI evidence"
      onClose={onClose}
      footer={
        <button className="secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="stack">
        <div>
          <p className="eyebrow">Current value</p>
          <div className="kpi-value">
            {formatMetric(result.value, result.unit)}
          </div>
          <Badge status={result.status}>{statusNames[result.status]}</Badge>
        </div>
        <section>
          <h3>Calculation</h3>
          <p>{def?.description}</p>
          <div className="notice">
            <code>{result.formula}</code>
            {Object.entries(result.operands).map(([name, value]) => (
              <p key={name}>
                {name.replaceAll("_", " ")}:{" "}
                {new Intl.NumberFormat("en-GB", {
                  maximumFractionDigits: 4,
                }).format(value)}
              </p>
            ))}
          </div>
        </section>
        <section>
          <h3>Reporting and comparison</h3>
          <p>Reporting: {rangeLabel(result.period)}</p>
          <p>
            Compared with:{" "}
            {result.comparisonPeriod
              ? rangeLabel(result.comparisonPeriod)
              : "No comparison period"}
          </p>
          <p>
            Previous: {formatMetric(result.previousValue, result.unit)} · Trend:{" "}
            {result.trend}
          </p>
          <p>
            Target: {formatMetric(result.target, result.unit)} · Difference:{" "}
            {result.variance === undefined
              ? "Unavailable"
              : `${result.variance >= 0 ? "+" : ""}${formatMetric(result.variance, result.unit)}`}
          </p>
          {def && (
            <p>
              Watch at {def.warningThreshold}% adverse target deviation; needs
              attention at {def.criticalThreshold}%. Percentage KPI deltas are
              percentage points; thresholds are relative deviations from the
              target.
            </p>
          )}
        </section>
        <section>
          <h3>Source evidence</h3>
          <SourcesEvidence
            references={result.sourceReferences}
            onReviewSource={(id) => {
              onClose();
              onReviewSource(id);
            }}
          />
        </section>
        <section>
          <h3>Quality and limitations</h3>
          {result.qualityNotes.length ? (
            result.qualityNotes.map((note, i) => <p key={i}>{note}</p>)
          ) : (
            <p>
              Uses the confirmed mappings and displayed periods. The
              calculations do not establish why a change occurred.
            </p>
          )}
          <p>
            {dashboard.sources.every((s) => s.isSample)
              ? "Fictional sample data."
              : "Contains local uploads. Files have not been independently verified."}{" "}
            Data stays in this browser.
          </p>
        </section>
      </div>
    </Sheet>
  );
}
function TrendChart({
  dashboard,
  onUpdate,
}: {
  dashboard: Dashboard;
  onUpdate: (d: Dashboard) => void;
}) {
  const [metricId, setMetricId] = useState("revenue");
  const info = useMemo(() => {
    const defs = dashboard.definitions.filter((d) => !d.custom);
    const revenue = defs.find(
      (d) => d.id === "revenue" || d.id === "consulting-revenue",
    );
    const selected =
      metricId === "revenue"
        ? (revenue ?? defs[0])
        : (defs.find((d) => d.id === metricId) ?? defs[0]);
    if (!selected) return null;
    const periods = dashboard.sources.flatMap((s) =>
      s.period ? [s.period] : [],
    );
    const range = periods.length
      ? {
          start: periods.map((p) => p.start).sort()[0],
          end: periods
            .map((p) => p.end)
            .sort()
            .at(-1)!,
        }
      : dashboard.dateRange;
    const result = calculateKpi(
      selected,
      dashboard.sources,
      dashboard.mappings,
      range,
      undefined,
      dashboard.filters,
    );
    const food = defs.find((d) => d.id === "food-cost");
    const cost =
      selected.unit === "currency" && food
        ? calculateKpi(
            {
              ...food,
              requiredInputs: ["food_cost"],
              formulaKey: "sum",
              unit: "currency",
            },
            dashboard.sources,
            dashboard.mappings,
            range,
            undefined,
            dashboard.filters,
          )
        : undefined;
    const dates = [
      ...new Set([
        ...result.series.map((p) => p.date),
        ...(cost?.series.map((p) => p.date) ?? []),
      ]),
    ].sort();
    return {
      selected,
      result,
      range,
      data: dates.map((date) => ({
        date,
        value: result.series.find((p) => p.date === date)?.value,
        cost: cost?.series.find((p) => p.date === date)?.value,
      })),
      hasCost: !!cost?.series.length,
    };
  }, [dashboard, metricId]);
  if (!info) return null;
  const { data, selected, result, range, hasCost } = info;
  const common = (
    <>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis
        dataKey="date"
        tick={{ fontSize: 11, fill: "var(--muted)" }}
        tickFormatter={(d) => String(d).slice(0, 7)}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        width={48}
        tick={{ fontSize: 10, fill: "var(--muted)" }}
        tickFormatter={(v) => formatMetric(Number(v), selected.unit, true)}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip
        formatter={(v) => formatMetric(Number(v), selected.unit)}
        contentStyle={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          color: "var(--ink)",
        }}
      />
      {selected.target !== undefined && (
        <ReferenceLine
          y={selected.target}
          stroke="var(--green)"
          strokeDasharray="3 3"
        />
      )}
    </>
  );
  return (
    <section className="panel stack trend-panel">
      <div>
        <h2>{hasCost ? "Revenue & cost trend" : `${selected.name} trend`}</h2>
        <p>Monthly values · {rangeLabel(range)}</p>
      </div>
      <div className="trend-controls">
        <label className="field">
          Trend metric
          <select
            value={selected.id}
            onChange={(e) => setMetricId(e.target.value)}
          >
            {dashboard.definitions
              .filter((d) => !d.custom)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          Chart style
          <select
            value={dashboard.chartType}
            onChange={(e) =>
              onUpdate({
                ...dashboard,
                chartType: e.target.value as Dashboard["chartType"],
              })
            }
          >
            <option value="line">Line chart</option>
            <option value="bar">Bar chart</option>
          </select>
        </label>
      </div>
      <p className="legend">
        {selected.name}
        {hasCost &&
          (dashboard.chartType === "line"
            ? " · Food cost (dashed amber)"
            : " · Food cost (amber)")}
        {selected.target !== undefined && " · Target (green)"}
      </p>
      {data.length > 0 ? (
        <div
          style={{ width: "100%", height: 220, minWidth: 0, overflow: "clip" }}
          aria-label={`${selected.name} monthly trend. Supporting values follow.`}
          role="img"
        >
          <ResponsiveContainer width="100%" height="100%">
            {dashboard.chartType === "bar" ? (
              <BarChart data={data} accessibilityLayer={false}>
                {common}
                <Bar
                  isAnimationActive={false}
                  dataKey="value"
                  name={selected.name}
                  fill="var(--accent)"
                />
                {hasCost && (
                  <Bar
                    isAnimationActive={false}
                    dataKey="cost"
                    name="Food cost"
                    fill="var(--amber)"
                  />
                )}
              </BarChart>
            ) : (
              <LineChart data={data} accessibilityLayer={false}>
                {common}
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="value"
                  name={selected.name}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                {hasCost && (
                  <Line
                    isAnimationActive={false}
                    dataKey="cost"
                    name="Food cost"
                    stroke="var(--amber)"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="notice">
          No confirmed data is available for this trend. Review source mappings
          before interpreting the dashboard.
        </p>
      )}
      <p>
        Chart uses the available source history, independently of the reporting
        period above. A target line is meaningful only for matching period
        lengths.
      </p>
      <details>
        <summary>Trend values and limitations</summary>
        <div className="stack">
          {data.map((row) => (
            <div className="notice" key={row.date}>
              <strong>{row.date}</strong>
              <p>
                {selected.name}: {formatMetric(row.value, selected.unit)}
              </p>
              {hasCost && (
                <p>Food cost: {formatMetric(row.cost, "currency")}</p>
              )}
            </div>
          ))}
          {result.qualityNotes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </div>
      </details>
    </section>
  );
}
export function DashboardView({
  dashboard,
  onEdit,
  onUpdate,
  onReviewSource,
}: {
  dashboard: Dashboard;
  onEdit?: () => void;
  onUpdate: (d: Dashboard) => void;
  onReviewSource: (id: string) => void;
}) {
  const [detail, setDetail] = useState<KpiResult | null>(null),
    [warning, setWarning] = useState<Warning | null>(null);
  const sampleLabel =
    dashboard.sources.length === 0
      ? "No sources"
      : dashboard.sources.every((s) => s.isSample)
        ? "Sample data"
        : dashboard.sources.some((s) => s.isSample)
          ? "Mixed sample & local"
          : "Local uploads";
  return (
    <div className="stack dashboard-view">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">
            {dashboard.context.scenario === "restaurant"
              ? "Restaurant"
              : "Consulting"}{" "}
            dashboard
          </p>
          <h1>{dashboard.name}</h1>
          <p className="subtitle">{dashboard.context.goal}</p>
        </div>
        {onEdit && (
          <button className="secondary" onClick={onEdit}>
            <Icon name="edit" /> Edit dashboard
          </button>
        )}
      </header>
      <BusinessSummary
        dashboard={dashboard}
        onReviewKpi={setDetail}
        onReviewWarning={setWarning}
      />
      <DashboardFilters
        dashboard={dashboard}
        onUpdate={onUpdate}
        sourceLabel={sampleLabel}
      />
      <section aria-labelledby="performance-heading">
        <div className="section-heading">
          <h2 id="performance-heading">Key performance</h2>
          <small>
            Updated {new Date(dashboard.updatedAt).toLocaleString()}
          </small>
        </div>
        {dashboard.kpiResults.length > 0 &&
          dashboard.kpiResults.every(
            (result) => result.value === undefined,
          ) && (
            <p className="notice">
              No KPI values are available for this view. Check the reporting
              dates, filters, or source mappings. Open a KPI’s evidence to see
              the specific reason.
            </p>
          )}
        <div className="kpi-grid">
          {dashboard.kpiResults.map((k) => (
            <article className="kpi-card" key={k.id}>
              <div className="card-top">
                <h3>{k.name}</h3>
                <Badge status={k.status}>{statusNames[k.status]}</Badge>
              </div>
              <div className="kpi-value">
                {formatMetric(k.value, k.unit, true)}
              </div>
              <div className="kpi-meta">
                <span>Target {formatMetric(k.target, k.unit, true)}</span>
                <strong className={k.status}>
                  {k.variance === undefined
                    ? "No valid result"
                    : `${k.variance >= 0 ? "+" : ""}${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(k.variance)}${k.unit === "percentage" ? " pts" : k.unit === "currency" ? " EUR" : ""} vs target`}
                </strong>
                <span>Trend: {k.trend}</span>
              </div>
              <button
                className="card-footer"
                onClick={() => setDetail(k)}
                aria-label={`View evidence for ${k.name}`}
              >
                View evidence <Icon name="chevron" size={16} />
              </button>
            </article>
          ))}
        </div>
        {dashboard.kpiResults.length === 0 && (
          <p className="notice">
            No KPIs selected. Edit the dashboard to select indicators.
          </p>
        )}
      </section>
      <div className="dashboard-columns">
        <TrendChart dashboard={dashboard} onUpdate={onUpdate} />
        <section className="panel attention-panel">
          <div className="section-heading">
            <h2>Needs your attention</h2>
            <small>
              {dashboard.warnings.length}{" "}
              {dashboard.warnings.length === 1 ? "warning" : "warnings"}
            </small>
          </div>
          {dashboard.warnings.map((w) => (
            <button
              key={w.id}
              className="warning-row"
              onClick={() => setWarning(w)}
            >
              <span
                className={`warning-icon ${w.priority === "high" ? "high" : "medium"}`}
              >
                <Icon name="warning" />
              </span>
              <span className="warning-copy">
                <strong>{w.title}</strong>
                <small>
                  {w.priority} priority · {w.changedValues[0] ?? w.ruleKey}
                </small>
              </span>
              <Icon name="chevron" />
            </button>
          ))}
          {!dashboard.warnings.length && (
            <p>No rule-based warnings in this reporting period.</p>
          )}
          <div className="human-note">
            <strong>You remain in control.</strong>
            <p>
              dAIshi highlights evidence and possible issues. You decide what to
              do next.
            </p>
          </div>
        </section>
      </div>
      {dashboard.assumptions.length > 0 && (
        <details className="panel">
          <summary>Decision and assumptions</summary>
          {dashboard.assumptions.map((a) => (
            <div key={a.id}>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <p>Expected outcome: {a.expectedOutcome}</p>
            </div>
          ))}
        </details>
      )}
      {detail && (
        <KpiEvidence
          result={detail}
          dashboard={dashboard}
          onClose={() => setDetail(null)}
          onReviewSource={onReviewSource}
        />
      )}{" "}
      {warning && (
        <WarningDetails
          warning={warning}
          onClose={() => setWarning(null)}
          onReviewSource={onReviewSource}
        />
      )}
    </div>
  );
}
