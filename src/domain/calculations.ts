import type {
  DataMapping,
  DataSource,
  DateRange,
  Draft,
  KpiDefinition,
  KpiResult,
  KpiStatus,
  SourceReference,
} from "./models";

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (
    typeof value !== "string" ||
    !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())
  )
    return undefined;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}
export function parseDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  const expanded = /^\d{4}-\d{2}$/.test(text) ? text + "-01" : text;
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
      expanded,
    )
  )
    return undefined;
  if (expanded.includes("T") && !Number.isFinite(Date.parse(expanded)))
    return undefined;
  const date = expanded.slice(0, 10),
    parsed = new Date(date + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
    ? date
    : undefined;
}
export function validRange(range: DateRange): boolean {
  return (
    !!parseDate(range.start) &&
    !!parseDate(range.end) &&
    range.start <= range.end
  );
}
export function statusFor(
  value: number | undefined,
  definition: KpiDefinition,
): KpiStatus {
  if (value === undefined || !Number.isFinite(value)) return "unavailable";
  if (definition.target === undefined) return "on-track";
  const adverse =
    definition.direction === "lower-is-better"
      ? value - definition.target
      : definition.target - value;
  if (adverse <= 0) return "on-track";
  const relative =
    definition.target === 0
      ? Infinity
      : (adverse / Math.abs(definition.target)) * 100;
  if (relative + 1e-9 >= definition.criticalThreshold) return "critical";
  if (relative + 1e-9 >= definition.warningThreshold) return "watch";
  return "on-track";
}
function compute(
  formula: string,
  inputs: number[],
  definition: KpiDefinition,
): number | undefined {
  if (formula === "sum" || formula === "mean") return inputs[0];
  if (formula === "ratio")
    return inputs[1] === 0 ? undefined : (inputs[0] / inputs[1]) * 100;
  // Growth is resolved after both periods are evaluated.
  if (formula === "growth") return inputs[0];
  if (definition.custom) return undefined;
  return undefined;
}
const formulaText = (definition: KpiDefinition) =>
  definition.custom
    ? "Metadata only — no calculation configured."
    : definition.formulaKey === "growth"
      ? "(Current revenue − comparison revenue) ÷ comparison revenue × 100"
      : definition.formulaKey === "ratio"
        ? `${definition.requiredInputs[0]} ÷ ${definition.requiredInputs[1]} × 100`
        : `${definition.formulaKey === "mean" ? "Arithmetic mean" : "Sum"} of ${definition.requiredInputs[0]}`;

export function calculateKpi(
  definition: KpiDefinition,
  sources: DataSource[],
  mappings: DataMapping[],
  period: DateRange,
  comparisonPeriod?: DateRange,
  filters: Record<string, string> = {},
): KpiResult {
  const notes: string[] = [];
  const base: KpiResult = {
    id: `result-${definition.id}`,
    kpiId: definition.id,
    name: definition.name,
    unit: definition.unit,
    target: definition.target,
    trend: "unknown",
    status: "unavailable",
    period,
    comparisonPeriod,
    sourceReferences: [],
    qualityNotes: notes,
    formula: formulaText(definition),
    operands: {},
    series: [],
  };
  if (definition.custom) {
    notes.push(
      "Custom KPI is stored as metadata only. No value is calculated.",
    );
    return base;
  }
  if (
    !validRange(period) ||
    (comparisonPeriod && !validRange(comparisonPeriod))
  ) {
    notes.push("Choose valid reporting and comparison date ranges.");
    return base;
  }
  if (
    comparisonPeriod &&
    period.start <= comparisonPeriod.end &&
    comparisonPeriod.start <= period.end
  ) {
    notes.push(
      "Reporting and comparison periods overlap. Choose separate periods.",
    );
    return base;
  }
  const relevant = mappings.filter((m) => m.kpiId === definition.id);
  const selected = definition.requiredInputs.map((input) =>
    relevant.filter(
      (m) =>
        m.inputName === input &&
        m.status === "confirmed" &&
        m.sourceId &&
        m.sourceField,
    ),
  );
  const missing = definition.requiredInputs.filter(
    (_, i) => selected[i].length !== 1,
  );
  if (missing.length) {
    notes.push(`Confirm exactly one mapping for: ${missing.join(", ")}.`);
    return base;
  }
  const numericMappings = selected.map((group) => group[0]);
  const sourceIds = [...new Set(numericMappings.map((m) => m.sourceId))];
  if (sourceIds.length !== 1) {
    notes.push(
      "Inputs come from different files. Use one combined, period-aligned file for this KPI to avoid unsupported joins.",
    );
    return base;
  }
  const source = sources.find((s) => s.id === sourceIds[0]);
  if (!source || source.status === "invalid") {
    notes.push(
      "The mapped source is missing or invalid. Replace it and confirm the mapping.",
    );
    return base;
  }
  const dateMappings = relevant.filter(
    (m) =>
      m.inputName === "date" &&
      m.sourceId === source.id &&
      m.status === "confirmed" &&
      m.sourceField,
  );
  if (dateMappings.length !== 1) {
    notes.push(
      "Confirm a date-field mapping from the same file as the KPI inputs.",
    );
    return base;
  }
  const dateMapping = dateMappings[0];
  if (
    ![dateMapping, ...numericMappings].every((m) =>
      source.fieldNames.includes(m.sourceField),
    )
  ) {
    notes.push(
      "A mapped column no longer exists. Review the mapping after replacing the source.",
    );
    return base;
  }
  const dated = source.rows.map((row, index) => ({
    row,
    date: parseDate(row[dateMapping.sourceField]),
    index,
  }));
  if (dated.some((item) => !item.date)) {
    notes.push(
      "The source contains missing or invalid ISO dates. Correct the file (YYYY-MM-DD or YYYY-MM) and upload again.",
    );
    return base;
  }
  const filtered = dated.filter((item) =>
    Object.entries(filters).every(
      ([field, value]) =>
        !value || value === "*" || String(item.row[field] ?? "") === value,
    ),
  );
  if (
    Object.keys(filters).some(
      (field) =>
        filters[field] &&
        filters[field] !== "*" &&
        !source.fieldNames.includes(field),
    )
  ) {
    notes.push(
      "A selected filter field is absent from this source. Clear the filter to calculate this KPI.",
    );
    return base;
  }
  const rowsFor = (range: DateRange) =>
    filtered.filter(
      (item) => item.date! >= range.start && item.date! <= range.end,
    );
  const current = rowsFor(period),
    previous = comparisonPeriod ? rowsFor(comparisonPeriod) : [];
  const reference = (
    mapping: DataMapping,
    range: DateRange,
    count: number,
  ): SourceReference => ({
    sourceId: source.id,
    sourceName: source.name,
    field: mapping.sourceField,
    inputName: mapping.inputName,
    period: range,
    rowCount: count,
    sheet: source.selectedSheet,
  });
  base.sourceReferences = [dateMapping, ...numericMappings].map((mapping) =>
    reference(mapping, period, current.length),
  );
  if (comparisonPeriod)
    base.sourceReferences.push(
      ...numericMappings.map((mapping) =>
        reference(mapping, comparisonPeriod, previous.length),
      ),
    );
  if (!current.length) {
    notes.push(
      "No matching source rows exist in this period. Choose another period or clear the filters.",
    );
    return base;
  }
  const duplicateRows = new Set<string>();
  for (const item of current) {
    const key = JSON.stringify(
      source.fieldNames.map((field) => item.row[field]),
    );
    if (duplicateRows.has(key)) {
      notes.push(
        "Identical source rows may be duplicated. Remove duplicates and upload again; no value has been calculated.",
      );
      return base;
    }
    duplicateRows.add(key);
  }
  const aggregate = (
    items: typeof current,
    quiet = false,
  ): number[] | undefined => {
    if (!items.length) return undefined;
    const output: number[] = [];
    for (const mapping of numericMappings) {
      const numbers = items.map((item) =>
        parseNumber(item.row[mapping.sourceField]),
      );
      if (numbers.some((value) => value === undefined)) {
        if (!quiet)
          notes.push(
            `Missing or invalid numbers in ${mapping.sourceField}. Empty, formatted or ambiguous values are not treated as zero.`,
          );
        return undefined;
      }
      const valid = numbers as number[];
      if (mapping.inputName !== "revenue" && valid.some((value) => value < 0)) {
        if (!quiet)
          notes.push(
            `${mapping.sourceField} contains a negative count, cost, hours, or score. Review the input.`,
          );
        return undefined;
      }
      if (
        mapping.inputName.includes("satisfaction") &&
        valid.some((value) => value > 10)
      ) {
        if (!quiet)
          notes.push(
            `${mapping.sourceField} must use the documented 0–10 scale.`,
          );
        return undefined;
      }
      const total = valid.reduce((sum, value) => sum + value, 0);
      output.push(
        definition.formulaKey === "mean" ? total / valid.length : total,
      );
    }
    return output;
  };
  const operands = aggregate(current);
  if (!operands) return base;
  if (
    definition.formulaKey === "ratio" &&
    ["repeat_customers", "completed_projects", "delivery_revenue"].includes(
      definition.requiredInputs[0],
    ) &&
    current.some(
      (item) =>
        parseNumber(item.row[numericMappings[0].sourceField])! >
        parseNumber(item.row[numericMappings[1].sourceField])!,
    )
  ) {
    notes.push(
      "A source row has a numerator greater than its total. Correct the inconsistent row before calculating this ratio.",
    );
    return base;
  }
  if (definition.formulaKey === "ratio" && operands[1] < 0) {
    notes.push(
      "The denominator is negative. Review the source scope and period before calculating this ratio.",
    );
    return base;
  }
  if (
    definition.formulaKey === "ratio" &&
    ["repeat_customers", "completed_projects", "delivery_revenue"].includes(
      definition.requiredInputs[0],
    ) &&
    operands[0] > operands[1]
  ) {
    notes.push(
      "The numerator exceeds its total population or revenue. Confirm matching scopes before calculating this ratio.",
    );
    return base;
  }
  base.operands = Object.fromEntries(
    definition.requiredInputs.map((input, index) => [input, operands[index]]),
  );
  let value = compute(definition.formulaKey, operands, definition);
  const previousKeys = previous.map((item) =>
    JSON.stringify(source.fieldNames.map((field) => item.row[field])),
  );
  const comparisonDuplicated =
    new Set(previousKeys).size !== previousKeys.length;
  if (comparisonDuplicated)
    notes.push(
      "Comparison-period rows may be duplicated. The comparison and trend are unavailable until the file is corrected.",
    );
  const previousOperands = comparisonDuplicated
    ? undefined
    : aggregate(previous, true);
  let previousValue = previousOperands
    ? compute(definition.formulaKey, previousOperands, definition)
    : undefined;
  if (definition.formulaKey === "growth") {
    if (!previousOperands || previousOperands[0] === 0) {
      notes.push(
        "Revenue growth requires a comparison period with valid non-zero revenue.",
      );
      return base;
    }
    base.operands = {
      current_revenue: operands[0],
      previous_revenue: previousOperands[0],
    };
    value = ((operands[0] - previousOperands[0]) / previousOperands[0]) * 100;
    previousValue = undefined; // A third period would be needed to compare two growth rates.
  }
  if (value === undefined || !Number.isFinite(value)) {
    notes.push(
      "A denominator is zero or the formula is unsupported. No value has been calculated.",
    );
    return base;
  }
  base.value = value;
  base.status = statusFor(value, definition);
  base.previousValue = previousValue;
  if (definition.target !== undefined) {
    base.variance = value - definition.target;
    base.variancePercent =
      definition.target === 0
        ? undefined
        : (base.variance / Math.abs(definition.target)) * 100;
  }
  if (previousValue !== undefined) {
    base.comparisonChange = value - previousValue;
    base.trend =
      Math.abs(value - previousValue) < 1e-9
        ? "stable"
        : value > previousValue
          ? "up"
          : "down";
  } else if (definition.formulaKey !== "growth" && comparisonPeriod)
    notes.push("No valid comparison value is available; the trend is unknown.");
  const months = [
    ...new Set(current.map((item) => item.date!.slice(0, 7))),
  ].sort();
  if (definition.formulaKey !== "growth")
    base.series = months.flatMap((month) => {
      const values = aggregate(
        current.filter((item) => item.date!.startsWith(month)),
        true,
      );
      const point = values
        ? compute(definition.formulaKey, values, definition)
        : undefined;
      return point !== undefined && Number.isFinite(point)
        ? [{ date: month + "-01", value: point }]
        : [];
    });
  if (source.isSample)
    notes.push(
      "Fictional demonstration data; these are not live business results.",
    );
  notes.push(...source.warnings.filter((warning) => !notes.includes(warning)));
  return base;
}
export function calculateAll(draft: Draft): KpiResult[] {
  return draft.definitions.map((definition) =>
    calculateKpi(
      definition,
      draft.sources,
      draft.mappings,
      draft.dateRange,
      draft.comparisonPeriod,
      draft.filters,
    ),
  );
}
export function formatValue(
  value: number | undefined,
  unit: KpiDefinition["unit"],
): string {
  if (value === undefined || !Number.isFinite(value)) return "Unavailable";
  if (unit === "currency")
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      notation: Math.abs(value) >= 10000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  return (
    new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value) +
    (unit === "percentage" ? "%" : unit === "hours" ? " h" : "")
  );
}
