import type {
  DataSource,
  KpiDefinition,
  KpiResult,
  SourceReference,
  Warning,
} from "./models";
import { formatValue, parseDate, parseNumber } from "./calculations";
import { normalizeField } from "./mappingRules";
import { INPUT_ALIASES } from "./kpiDefinitions";

export function generateWarnings(
  results: KpiResult[],
  sources: DataSource[],
  definitions: KpiDefinition[],
  now?: string | Date,
  freshnessDays = 45,
): Warning[] {
  const warnings: Warning[] = [];
  for (const result of results) {
    const definition = definitions.find((k) => k.id === result.kpiId);
    if (!definition) continue;
    if (result.status === "unavailable") {
      warnings.push({
        id: `missing-${result.kpiId}`,
        kpiId: result.kpiId,
        priority: definition.custom ? "low" : "medium",
        title: `${result.name}: ${definition.custom ? "metadata only" : "needs review"}`,
        explanation:
          result.qualityNotes[0] ?? "Required inputs are unavailable.",
        changedValues: [],
        ruleKey: definition.custom ? "metadata-only" : "missing-input",
        sourceReferences: result.sourceReferences,
        caveats: result.qualityNotes,
        possibleNextStep: definition.custom
          ? "Keep this definition for future implementation."
          : "Review the source file, dates and confirmed mappings. Saved work is safe.",
      });
    } else if (result.status === "critical" || result.status === "watch") {
      const relative = Math.abs(result.variancePercent ?? 0);
      const deviationExplanation =
        result.target === 0
          ? "A relative percentage cannot be calculated against a zero target. Any adverse non-zero value triggers a critical warning."
          : `The adverse deviation is ${relative.toFixed(1)}% of the target; ${result.status === "critical" ? definition.criticalThreshold : definition.warningThreshold}% triggers this warning.`;
      warnings.push({
        id: `target-${result.kpiId}`,
        kpiId: result.kpiId,
        priority: result.status === "critical" ? "high" : "medium",
        title: `${result.name} ${result.status === "critical" ? "needs attention" : "is on watch"}`,
        explanation: `${formatValue(result.value, result.unit)} versus ${formatValue(result.target, result.unit)} target in ${result.period.start} to ${result.period.end}. ${deviationExplanation}`,
        changedValues: [
          `Current: ${formatValue(result.value, result.unit)}`,
          `Target: ${formatValue(result.target, result.unit)}`,
          `Comparison (${result.comparisonPeriod?.start ?? "not selected"} to ${result.comparisonPeriod?.end ?? "not selected"}): ${formatValue(result.previousValue, result.unit)}`,
        ],
        impact:
          result.unit === "currency" && result.variance !== undefined
            ? `Difference from the selected-period target: ${formatValue(result.variance, "currency")}. This is a measured variance, not a forecast.`
            : undefined,
        ruleKey:
          result.status === "critical"
            ? "critical-deviation"
            : "target-deviation",
        sourceReferences: result.sourceReferences,
        caveats: result.qualityNotes,
        possibleNextStep:
          "Review the supporting rows and original assumption before deciding whether to act.",
      });
    }
  }
  const day =
    (now instanceof Date ? now.toISOString() : now) ??
    sources
      .map((s) => s.uploadedAt)
      .sort()
      .at(-1) ??
    "2026-10-28";
  const currentDate = parseDate(day);
  for (const source of sources) {
    const ref = results
      .flatMap((r) => r.sourceReferences)
      .find((r) => r.sourceId === source.id);
    if (!ref) continue;
    const dateField = results
      .flatMap((r) => r.sourceReferences)
      .find((r) => r.sourceId === source.id && r.inputName === "date")?.field;
    const dates = source.rows
      .map((row) => parseDate(row[dateField ?? "date"]))
      .filter((d): d is string => !!d)
      .sort();
    const lastDate = dates.at(-1);
    if (
      currentDate &&
      lastDate &&
      (Date.parse(currentDate) - Date.parse(lastDate)) / 86400000 >
        freshnessDays
    )
      warnings.push({
        id: `stale-${source.id}`,
        priority: "medium",
        title: `${source.name}: outdated source`,
        explanation: `The latest record is dated ${lastDate}, more than ${freshnessDays} days before ${currentDate}. Re-uploading an old file does not refresh the underlying data.`,
        changedValues: [`Last record: ${lastDate}`],
        ruleKey: "stale-source",
        sourceReferences: [ref],
        caveats: source.isSample
          ? ["This is a fictional sample; dates are illustrative."]
          : [],
        possibleNextStep:
          "Check whether a newer source exists before relying on this result.",
      });
  }
  // Compare overlapping totals in alternative sources, never add them together.
  // Matching field names and dates establish possible conflict, not which file is correct.
  for (let i = 0; i < sources.length; i++)
    for (let j = i + 1; j < sources.length; j++) {
      const a = sources[i],
        b = sources[j];
      if (a.status === "invalid" || b.status === "invalid") continue;
      const canonical = (field: string) =>
        Object.entries(INPUT_ALIASES).find(([, aliases]) =>
          aliases.some(
            (alias) => normalizeField(alias) === normalizeField(field),
          ),
        )?.[0] ?? normalizeField(field);
      const dateA = a.fieldNames.find((f) => canonical(f) === "date");
      const dateB = b.fieldNames.find((f) => canonical(f) === "date");
      if (!dateA || !dateB) continue;
      const shared = a.fieldNames.flatMap((field) => {
        const other = b.fieldNames.find(
          (f) => canonical(f) === canonical(field),
        );
        return other && field !== dateA ? [{ field, other }] : [];
      });
      const totals = (source: DataSource, dateField: string, field: string) => {
        const map = new Map<string, { sum: number; valid: boolean }>();
        for (const row of source.rows) {
          const date = parseDate(row[dateField]);
          if (!date) continue;
          const value = parseNumber(row[field]);
          const prior = map.get(date) ?? { sum: 0, valid: true };
          map.set(date, {
            sum: prior.sum + (value ?? 0),
            valid: prior.valid && value !== undefined,
          });
        }
        return map;
      };
      const datesA = new Set(
        a.rows.map((row) => parseDate(row[dateA])).filter(Boolean),
      );
      const overlap = [
        ...new Set(
          b.rows
            .map((row) => parseDate(row[dateB]))
            .filter((date): date is string => !!date && datesA.has(date)),
        ),
      ];
      const conflicts = shared.filter(({ field, other }) => {
        const totalsA = totals(a, dateA, field),
          totalsB = totals(b, dateB, other);
        return overlap.some((date) => {
          const va = totalsA.get(date),
            vb = totalsB.get(date);
          return va?.valid && vb?.valid && Math.abs(va.sum - vb.sum) > 1e-7;
        });
      });
      if (conflicts.length) {
        const references: SourceReference[] = [a, b].map((source) => ({
          sourceId: source.id,
          sourceName: source.name,
          field: conflicts
            .map((f) => (source.id === a.id ? f.field : f.other))
            .join(", "),
          inputName: "conflicting-source",
          rowCount: source.rowCount,
          period: { start: overlap.sort()[0], end: overlap.sort().at(-1)! },
          sheet: source.selectedSheet,
        }));
        warnings.push({
          id: `conflict-${a.id}-${b.id}`,
          priority: "high",
          title: "Overlapping sources disagree",
          explanation: `${a.name} and ${b.name} have different totals for ${conflicts.map((f) => f.field).join(", ")} on overlapping dates. Only the source selected in each confirmed mapping is used; files are never silently added together.`,
          changedValues: [`Overlapping dates: ${overlap.join(", ")}`],
          ruleKey: "conflicting-source",
          sourceReferences: references,
          caveats: [
            "Matching names and dates may describe different business scopes. This rule detects a possible conflict, not which source is correct.",
          ],
          possibleNextStep:
            "Confirm the correct source and scope, or remove the outdated file.",
        });
      }
    }
  const rank = { high: 0, medium: 1, low: 2 };
  return warnings.sort(
    (a, b) => rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id),
  );
}
