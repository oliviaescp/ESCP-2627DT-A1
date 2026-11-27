import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
import { calculateKpi, formatMetric } from "../domain/calculations";
import { filterLabel } from "../domain/filters";
import type { Dashboard, DataSource, KpiResult } from "../domain/models";

const shortMonth = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

export function GuideSource({
  source,
  fields,
}: {
  source: DataSource;
  fields: string[];
}) {
  return (
    <section className="guide-preview" aria-label="Sample source">
      <div className="guide-preview-head">
        <h3>{source.name}</h3>
        <Badge>Fictional CSV</Badge>
      </div>
      <div className="table-wrap">
        <table className="guide-source-table">
          <caption>Last three rows</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              {fields.map((field) => (
                <th key={field} scope="col">
                  {filterLabel(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {source.rows.slice(-3).map((row, index) => (
              <tr key={index}>
                <td>{String(row.date)}</td>
                {fields.map((field) => (
                  <td key={field}>
                    {Number(row[field]).toLocaleString("en-GB")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function GuideDashboard({
  dashboard,
  reportingMonth,
  onInspect,
  evidence,
}: {
  dashboard: Dashboard;
  reportingMonth: string;
  onInspect?: (result: KpiResult) => void;
  evidence?: KpiResult;
}) {
  const lead = dashboard.definitions[0];
  const source = dashboard.sources[0];
  const { series } = calculateKpi(
    lead,
    dashboard.sources,
    dashboard.mappings,
    source.period ?? dashboard.dateRange,
    undefined,
    dashboard.filters,
  );
  const maximum = Math.max(1, ...series.map((point) => point.value));

  return (
    <section className="guide-preview" aria-label="Practice dashboard">
      <div className="guide-preview-head">
        <div>
          <h3>{dashboard.name}</h3>
          <p>{reportingMonth}</p>
        </div>
        <Badge>Fictional data</Badge>
      </div>
      <div className="guide-preview-metrics" aria-live="polite">
        {dashboard.kpiResults.map((result) => (
          <article key={result.id} className="guide-metric">
            <h4>{result.name}</h4>
            <strong>{formatMetric(result.value, result.unit, true)}</strong>
            <Badge status={result.status} />
            {onInspect && (
              <button
                className="text-button"
                aria-pressed={evidence?.id === result.id}
                onClick={() => onInspect(result)}
              >
                View {result.name.toLowerCase()} evidence{" "}
                <Icon name="chevron" size={15} />
              </button>
            )}
          </article>
        ))}
      </div>
      {evidence ? (
        <section
          className="guide-evidence"
          aria-label="KPI evidence"
          aria-live="polite"
        >
          <h4>{evidence.name} evidence</h4>
          <p>
            <strong>Formula</strong> {evidence.formula}
          </p>
          {evidence.sourceReferences
            .filter(
              (reference) => reference.period.start === evidence.period.start,
            )
            .map((reference) => (
              <p key={reference.inputName}>
                <strong>{filterLabel(reference.inputName)}</strong>{" "}
                {reference.sourceName} · {reference.field} ·{" "}
                {reference.rowCount} {reference.rowCount === 1 ? "row" : "rows"}
              </p>
            ))}
        </section>
      ) : (
        <figure className="guide-trend">
          <figcaption>{lead.name} history</figcaption>
          <ul aria-label={`${lead.name} by month`}>
            {series.map(({ date, value }) => {
              const month = shortMonth.format(new Date(date));
              return (
                <li
                  key={date}
                  aria-label={`${month}: ${formatMetric(value, lead.unit)}`}
                  className={
                    date === dashboard.dateRange.start ? "current" : ""
                  }
                >
                  <div className="guide-trend-track" aria-hidden="true">
                    <div style={{ height: `${(value / maximum) * 100}%` }} />
                  </div>
                  <span aria-hidden="true">{month}</span>
                </li>
              );
            })}
          </ul>
        </figure>
      )}
    </section>
  );
}
