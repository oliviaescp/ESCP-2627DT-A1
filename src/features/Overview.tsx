import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
import { confirmFields, newDraft, withSampleData } from "../app/workflow";
import { calculateKpi, formatMetric } from "../domain/calculations";
import type { Dashboard, Scenario } from "../domain/models";

function SamplePreview() {
  const draft = withSampleData(newDraft());
  const result = calculateKpi(
    draft.definitions[0],
    draft.sources,
    confirmFields(draft.mappings),
    draft.sources[0].period ?? draft.dateRange,
  );
  const maximum = Math.max(1, ...result.series.map((point) => point.value));
  const month = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  });
  const latest = result.series.at(-1);

  return (
    <section className="sample-preview" aria-label="Restaurant sample preview">
      <div className="sample-preview-heading">
        <Icon name="trend" size={22} />
        <Badge>Fictional sample</Badge>
      </div>
      <h2>{draft.context.companyOrProject}</h2>
      <p>{result.name}</p>
      <p className="sample-value">
        {formatMetric(latest?.value, result.unit, true)}
      </p>
      <ul className="sample-chart" aria-label="Monthly revenue by month">
        {result.series.map(({ date, value }) => {
          const label = month.format(new Date(date));
          return (
            <li
              key={date}
              aria-label={`${label} ${formatMetric(value, result.unit)}`}
            >
              <div className="sample-bar-track" aria-hidden="true">
                <div
                  className="sample-bar"
                  style={{
                    height: `${(value / maximum) * 100}%`,
                  }}
                />
              </div>
              <span aria-hidden="true">{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Overview({
  dashboards,
  hasDraft,
  onCreate,
  onSample,
  onOpen,
  onDelete,
}: {
  dashboards: Dashboard[];
  hasDraft: boolean;
  onCreate: () => void;
  onSample: (scenario: Scenario) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!dashboards.length) {
    return (
      <>
        <section className="welcome">
          <div className="welcome-copy">
            <h1>Welcome to dAIshi.</h1>
            <p>
              Build a KPI dashboard for a restaurant or consulting team and
              trace each result back to its source.
            </p>
            <button className="primary" onClick={onCreate}>
              {hasDraft
                ? "Resume dashboard setup"
                : "Create your first dashboard"}
              <Icon name="arrow" />
            </button>
            <small>
              Fictional data only. Files and dashboards stay in this browser.
            </small>
          </div>
          <SamplePreview />
        </section>
        <section className="sample-start" aria-labelledby="sample-start-title">
          <div>
            <h2 id="sample-start-title">Explore a sample dashboard</h2>
            <p>
              Open a dashboard with preset KPIs and confirmed fictional sources.
            </p>
          </div>
          <div className="actions">
            <button
              className="secondary"
              onClick={() => onSample("restaurant")}
            >
              Restaurant sample <Icon name="arrow" />
            </button>
            <button
              className="secondary"
              onClick={() => onSample("consulting")}
            >
              Consulting sample <Icon name="arrow" />
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <section aria-labelledby="saved-title">
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 id="saved-title">Your dashboards</h1>
          <p className="subtitle">
            {dashboards.length}{" "}
            {dashboards.length === 1 ? "dashboard" : "dashboards"} saved in this
            browser
          </p>
        </div>
        <button className="primary" onClick={onCreate}>
          <Icon name="plus" />{" "}
          {hasDraft ? "Resume saved setup" : "Create another dashboard"}
        </button>
      </div>
      <div className="saved-grid">
        {dashboards.map((dashboard) => (
          <article className="panel saved-card" key={dashboard.id}>
            <p className="eyebrow">{dashboard.context.scenario}</p>
            <h2>{dashboard.name}</h2>
            <p>{dashboard.context.goal}</p>
            <small>
              {dashboard.sources.length
                ? dashboard.sources.every((s) => s.isSample)
                  ? "Fictional sample"
                  : "Local workspace"
                : "No sources"}{" "}
              · {dashboard.warnings.length}{" "}
              {dashboard.warnings.length === 1 ? "warning" : "warnings"}
              <br />
              {dashboard.dateRange.start} – {dashboard.dateRange.end}
              <br />
              Updated {new Date(dashboard.updatedAt).toLocaleString()}
            </small>
            <div className="actions">
              <button
                className="secondary"
                onClick={() => onOpen(dashboard.id)}
              >
                Open dashboard <Icon name="arrow" />
              </button>
              <button
                className="icon-button quiet-danger"
                aria-label={`Delete ${dashboard.name}`}
                onClick={() => onDelete(dashboard.id)}
              >
                <Icon name="trash" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
