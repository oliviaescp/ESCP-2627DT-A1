import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
import { formatMetric } from "../domain/calculations";
import type { Dashboard, KpiResult, Warning } from "../domain/models";

function comparisonPhrase(result: KpiResult) {
  const change = result.comparisonChange;
  if (change === undefined || !Number.isFinite(change)) return "";
  if (Math.abs(change) < 0.05)
    return ", roughly unchanged from the comparison period";

  const magnitude =
    result.unit === "percentage"
      ? `${formatMetric(Math.abs(change), "number")} percentage points`
      : formatMetric(Math.abs(change), result.unit);
  return `, ${change > 0 ? "up" : "down"} ${magnitude} from the comparison period`;
}

export function BusinessSummary({
  dashboard,
  onReviewKpi,
  onReviewWarning,
}: {
  dashboard: Dashboard;
  onReviewKpi: (result: KpiResult) => void;
  onReviewWarning: (warning: Warning) => void;
}) {
  const available = dashboard.kpiResults.filter(
    (result) => result.value !== undefined,
  );
  const lead =
    available.find((result) => result.unit === "currency") ?? available[0];
  const review =
    available.find((result) => result.status === "critical") ??
    available.find((result) => result.status === "watch");
  const otherFlagged = available.filter(
    (result) =>
      result !== review &&
      (result.status === "critical" || result.status === "watch"),
  ).length;
  const missing = dashboard.kpiResults.length - available.length;
  const sourceWarning =
    dashboard.warnings.find(
      (warning) => warning.ruleKey === "conflicting-source",
    ) ??
    dashboard.warnings.find((warning) => warning.ruleKey === "stale-source");
  const sample =
    dashboard.sources.length > 0 &&
    dashboard.sources.every((source) => source.isSample);
  const evidence = review ?? lead;

  return (
    <section
      className="business-summary"
      aria-labelledby="business-summary-title"
    >
      <div className="business-summary-heading">
        <span className="business-summary-icon">
          <Icon name="sparkle" size={20} />
        </span>
        <div>
          <h2 id="business-summary-title">AI summary</h2>
          <small>Rule-based · generated on this device</small>
        </div>
        {sample && <Badge>Fictional sample</Badge>}
      </div>
      <div className="business-summary-copy" aria-live="polite">
        {lead ? (
          <>
            <p className="business-summary-lead">
              <strong>
                {lead.name} was {formatMetric(lead.value, lead.unit, true)}
              </strong>
              {comparisonPhrase(lead)}.
            </p>
            {review ? (
              <p>
                <strong>
                  {review.name}{" "}
                  {review.status === "critical"
                    ? "needs attention"
                    : "is on watch"}
                  .
                </strong>{" "}
                It was {formatMetric(review.value, review.unit)} against a
                target of {formatMetric(review.target, review.unit)}.
                {otherFlagged > 0 &&
                  ` ${otherFlagged} other ${otherFlagged === 1 ? "KPI is" : "KPIs are"} also flagged.`}
              </p>
            ) : (
              available.some((result) => result.target !== undefined) && (
                <p>
                  All available KPIs with targets are within their alert
                  thresholds.
                </p>
              )
            )}
            {missing > 0 && (
              <p className="summary-note">
                {missing} {missing === 1 ? "KPI is" : "KPIs are"} unavailable in
                this view.
              </p>
            )}
          </>
        ) : (
          <p className="business-summary-lead">
            {dashboard.sources.length === 0
              ? "Add a data source and confirm its fields to see a summary here."
              : dashboard.kpiResults.length === 0
                ? "Choose KPIs in Edit dashboard to see a summary here."
                : "The current view has no KPI values to summarize. Try different dates or filters, or check the source mappings."}
          </p>
        )}
        {sourceWarning && (
          <p className="summary-note">
            {sourceWarning.ruleKey === "conflicting-source"
              ? "Some sources report different totals for overlapping dates."
              : "A source has been flagged as outdated."}
          </p>
        )}
      </div>
      {(evidence || sourceWarning) && (
        <div className="actions summary-actions">
          {evidence && (
            <button
              className="text-button"
              onClick={() => onReviewKpi(evidence)}
            >
              Review {evidence.name} <Icon name="arrow" size={16} />
            </button>
          )}
          {sourceWarning && (
            <button
              className="text-button"
              onClick={() => onReviewWarning(sourceWarning)}
            >
              Check source warning <Icon name="chevron" size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
