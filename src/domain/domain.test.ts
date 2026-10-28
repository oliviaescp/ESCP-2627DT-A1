import { describe, expect, it } from "vitest";
import {
  calculateKpi,
  parseDate,
  parseNumber,
  statusFor,
} from "./calculations";
import { KPI_DEFINITIONS, recommendKpis } from "./kpiDefinitions";
import { suggestMappings } from "./mappingRules";
import { createSampleSources, getDefaultRanges } from "./sampleScenarios";
import { generateWarnings } from "./warningRules";
import type {
  DataMapping,
  DataSource,
  KpiDefinition,
  Scenario,
} from "./models";

function fixture(scenario: Scenario = "restaurant") {
  const sources = createSampleSources(scenario),
    definitions = recommendKpis(scenario),
    ranges = getDefaultRanges(sources);
  const mappings: DataMapping[] = suggestMappings(sources, definitions).map(
    (m) => ({ ...m, status: "confirmed" as const }),
  );
  return { sources, definitions, mappings, ...ranges };
}
const definition = (id: string) => KPI_DEFINITIONS.find((k) => k.id === id)!;
function result(id: string, scenario: Scenario = "restaurant") {
  const f = fixture(scenario);
  return calculateKpi(
    definition(id),
    f.sources,
    f.mappings,
    f.dateRange,
    f.comparisonPeriod,
  );
}
describe("deterministic fixed formulas", () => {
  it("sums only the selected month and exposes the comparison and source operands", () => {
    const value = result("revenue");
    expect(value.value).toBe(128400);
    expect(value.previousValue).toBe(125880);
    expect(value.variance).toBe(8400);
    expect(value.variancePercent).toBeCloseTo(7);
    expect(value.trend).toBe("up");
    expect(value.operands.revenue).toBe(128400);
    expect(
      value.sourceReferences.some(
        (ref) => ref.field === "revenue" && ref.period.start === "2026-10-01",
      ),
    ).toBe(true);
  });
  it("calculates weighted food cost rather than row ratio average", () => {
    const f = fixture();
    const value = calculateKpi(definition("food-cost"), f.sources, f.mappings, {
      start: "2026-09-01",
      end: "2026-10-31",
    });
    expect(value.value).toBeCloseTo(
      ((41540.4 + 43912.8) / (125880 + 128400)) * 100,
    );
    expect(value.series).toHaveLength(2);
    expect(value.series[0].date).toBe("2026-09-01");
    expect(value.series[1].value).toBeCloseTo(34.2);
  });
  it("calculates revenue growth from a separate nonzero comparison period", () => {
    expect(result("revenue-growth").value).toBeCloseTo(
      ((128400 - 125880) / 125880) * 100,
    );
  });
  it("calculates repeat rate, delivery share, and equal-weight satisfaction", () => {
    expect(result("repeat-customers").value).toBeCloseTo(41.8);
    expect(result("delivery-share").value).toBeCloseTo((33000 / 128400) * 100);
    expect(result("team-satisfaction").value).toBe(7.6);
  });
  it("calculates all consulting formulas from source facts", () => {
    expect(result("consulting-revenue", "consulting").value).toBe(100000);
    expect(result("project-completion", "consulting").value).toBeCloseTo(
      (2 / 3) * 100,
    );
    expect(result("team-utilization", "consulting").value).toBeCloseTo(
      (280 / 420) * 100,
    );
    expect(result("client-satisfaction", "consulting").value).toBeCloseTo(
      (8.1 + 7.7 + 7.8) / 3,
    );
    expect(result("overdue-tasks", "consulting").value).toBe(9);
  });
  it("supports explicit field filters without changing other rows", () => {
    const f = fixture("consulting");
    const value = calculateKpi(
      definition("consulting-revenue"),
      f.sources,
      f.mappings,
      f.dateRange,
      f.comparisonPeriod,
      { project: "Atlas" },
    );
    expect(value.value).toBe(45000);
    expect(value.previousValue).toBe(40000);
  });
  it("does not mutate inputs and returns identical outputs", () => {
    const f = fixture();
    const before = JSON.stringify(f);
    const a = calculateKpi(
      f.definitions[0],
      f.sources,
      f.mappings,
      f.dateRange,
      f.comparisonPeriod,
    );
    expect(
      calculateKpi(
        f.definitions[0],
        f.sources,
        f.mappings,
        f.dateRange,
        f.comparisonPeriod,
      ),
    ).toEqual(a);
    expect(JSON.stringify(f)).toBe(before);
  });
});
describe("guarded input and missing-data behavior", () => {
  it("never treats a missing input as zero", () => {
    const f = fixture();
    delete f.sources[0].rows[5].food_cost;
    const value = calculateKpi(
      definition("food-cost"),
      f.sources,
      f.mappings,
      f.dateRange,
    );
    expect(value.status).toBe("unavailable");
    expect(value.value).toBeUndefined();
    expect(value.qualityNotes.join(" ")).toContain(
      "Missing or invalid numbers",
    );
  });
  it("handles a zero denominator and zero revenue growth base", () => {
    const f = fixture();
    f.sources[0].rows[5].customers = 0;
    expect(
      calculateKpi(
        definition("repeat-customers"),
        f.sources,
        f.mappings,
        f.dateRange,
      ).value,
    ).toBeUndefined();
    f.sources[0].rows[4].revenue = 0;
    expect(
      calculateKpi(
        definition("revenue-growth"),
        f.sources,
        f.mappings,
        f.dateRange,
        f.comparisonPeriod,
      ).value,
    ).toBeUndefined();
  });
  it("requires mappings to be confirmed, including dates", () => {
    const f = fixture();
    const mappings = suggestMappings(f.sources, f.definitions);
    expect(
      calculateKpi(definition("revenue"), f.sources, mappings, f.dateRange)
        .value,
    ).toBeUndefined();
    f.mappings.find(
      (m) => m.kpiId === "revenue" && m.inputName === "date",
    )!.status = "suggested";
    expect(
      calculateKpi(definition("revenue"), f.sources, f.mappings, f.dateRange)
        .value,
    ).toBeUndefined();
  });
  it("rejects duplicated mappings, row duplicates, and ambiguous cross-file joins", () => {
    const f = fixture();
    f.mappings.push({
      ...f.mappings.find(
        (m) => m.kpiId === "revenue" && m.inputName === "revenue",
      )!,
      id: "dup",
    });
    expect(
      calculateKpi(definition("revenue"), f.sources, f.mappings, f.dateRange)
        .value,
    ).toBeUndefined();
    const g = fixture();
    g.sources[0].rows.push({ ...g.sources[0].rows[5] });
    expect(
      calculateKpi(
        definition("revenue"),
        g.sources,
        g.mappings,
        g.dateRange,
      ).qualityNotes.join(" "),
    ).toContain("duplicated");
    const h = fixture();
    h.mappings.find(
      (m) => m.kpiId === "food-cost" && m.inputName === "food_cost",
    )!.sourceId = "another";
    expect(
      calculateKpi(
        definition("food-cost"),
        h.sources,
        h.mappings,
        h.dateRange,
      ).qualityNotes.join(" "),
    ).toContain("different files");
  });
  it("rejects invalid dates, no-data periods, overlapping periods, and out-of-scale scores", () => {
    const f = fixture();
    f.sources[0].rows[0].date = "2026-02-30";
    expect(
      calculateKpi(definition("revenue"), f.sources, f.mappings, f.dateRange)
        .value,
    ).toBeUndefined();
    const g = fixture();
    expect(
      calculateKpi(definition("revenue"), g.sources, g.mappings, {
        start: "2027-01-01",
        end: "2027-01-31",
      }).value,
    ).toBeUndefined();
    expect(
      calculateKpi(
        definition("revenue"),
        g.sources,
        g.mappings,
        g.dateRange,
        g.dateRange,
      ).value,
    ).toBeUndefined();
    g.sources[0].rows[5].employee_satisfaction = 76;
    expect(
      calculateKpi(
        definition("team-satisfaction"),
        g.sources,
        g.mappings,
        g.dateRange,
      ).value,
    ).toBeUndefined();
  });
  it("rejects impossible population ratios and negative denominators", () => {
    const f = fixture();
    f.sources[0].rows[5].repeat_customers = 4000;
    expect(
      calculateKpi(
        definition("repeat-customers"),
        f.sources,
        f.mappings,
        f.dateRange,
      ).status,
    ).toBe("unavailable");
    f.sources[0].rows[5].revenue = -10;
    expect(
      calculateKpi(definition("food-cost"), f.sources, f.mappings, f.dateRange)
        .status,
    ).toBe("unavailable");
  });
  it("keeps custom KPI metadata unavailable", () => {
    const f = fixture();
    const custom: KpiDefinition = {
      ...definition("revenue"),
      id: "custom",
      custom: true,
    };
    const value = calculateKpi(custom, f.sources, f.mappings, f.dateRange);
    expect(value.value).toBeUndefined();
    expect(value.qualityNotes.join(" ")).toContain("metadata only");
  });
  it("accepts only finite unambiguous numbers and valid ISO dates", () => {
    for (const value of [
      "",
      null,
      undefined,
      true,
      "1,234",
      "€12",
      NaN,
      Infinity,
    ])
      expect(parseNumber(value)).toBeUndefined();
    expect(parseNumber("12.50")).toBe(12.5);
    expect(parseNumber(0)).toBe(0);
    expect(parseDate("2026-02-30")).toBeUndefined();
    expect(parseDate("2026-10")).toBe("2026-10-01");
    expect(parseDate("10/11/2026")).toBeUndefined();
    expect(parseDate("2026-10-01Tjunk")).toBeUndefined();
  });
});
describe("mapping and warning rules", () => {
  it("maps exact aliases with higher confidence and never auto-confirms", () => {
    const source: DataSource = {
      ...createSampleSources("restaurant")[0],
      fieldNames: ["Month", "Total Sales", "Food Cost", "some sales notes"],
    };
    const mappings = suggestMappings([source], [definition("food-cost")]);
    expect(mappings.find((m) => m.inputName === "revenue")?.sourceField).toBe(
      "Total Sales",
    );
    expect(mappings.find((m) => m.inputName === "date")?.sourceField).toBe(
      "Month",
    );
    expect(mappings.every((m) => m.status === "suggested")).toBe(true);
    expect(
      suggestMappings([source], [definition("repeat-customers")]).some(
        (m) => m.status === "unresolved",
      ),
    ).toBe(true);
  });
  it("uses relative adverse thresholds in both target directions, including zero targets", () => {
    expect(statusFor(96, { ...definition("revenue"), target: 100 })).toBe(
      "on-track",
    );
    expect(statusFor(95, { ...definition("revenue"), target: 100 })).toBe(
      "watch",
    );
    expect(statusFor(90, { ...definition("revenue"), target: 100 })).toBe(
      "critical",
    );
    expect(
      statusFor(7.2, { ...definition("team-satisfaction"), target: 8 }),
    ).toBe("critical");
    expect(statusFor(110, { ...definition("food-cost"), target: 100 })).toBe(
      "critical",
    );
    expect(statusFor(1, { ...definition("overdue-tasks"), target: 0 })).toBe(
      "critical",
    );
    expect(statusFor(0, { ...definition("overdue-tasks"), target: 0 })).toBe(
      "on-track",
    );
  });
  it("sorts warnings by priority and includes comparison, source, and triggering rule", () => {
    const f = fixture();
    const results = f.definitions.map((k) =>
      calculateKpi(k, f.sources, f.mappings, f.dateRange, f.comparisonPeriod),
    );
    const warnings = generateWarnings(
      results,
      f.sources,
      f.definitions,
      "2026-10-28",
    );
    const food = warnings.find((w) => w.kpiId === "food-cost")!;
    expect(food.ruleKey).toBe("target-deviation");
    expect(food.sourceReferences.length).toBeGreaterThan(0);
    expect(food.explanation).toContain("2026-10-01");
    expect(food.changedValues.join(" ")).toContain("2026-09-01");
    expect(warnings.every((w) => w.possibleNextStep)).toBe(true);
  });
  it("explains zero target warnings without claiming a percentage against zero", () => {
    const f = fixture("consulting");
    const zero = { ...definition("overdue-tasks"), target: 0 };
    const value = calculateKpi(zero, f.sources, f.mappings, f.dateRange);
    expect(
      generateWarnings([value], f.sources, [zero], "2026-10-28")[0].explanation,
    ).toContain("zero target");
  });
  it("detects stale records even if uploaded today", () => {
    const f = fixture();
    const results = [
      calculateKpi(f.definitions[0], f.sources, f.mappings, f.dateRange),
    ];
    expect(
      generateWarnings(results, f.sources, f.definitions, "2027-01-01").some(
        (w) => w.ruleKey === "stale-source",
      ),
    ).toBe(true);
  });
  it("flags overlapping source conflicts and never silently sums files", () => {
    const f = fixture();
    const alternate = {
      ...f.sources[0],
      id: "alternate",
      name: "alternate.csv",
      rows: f.sources[0].rows.map((row) => ({ ...row, revenue: 999 })),
    };
    f.sources.push(alternate);
    const value = calculateKpi(
      definition("revenue"),
      f.sources,
      f.mappings,
      f.dateRange,
    );
    expect(value.value).toBe(128400);
    expect(
      generateWarnings([value], f.sources, f.definitions, "2026-10-28").some(
        (w) => w.ruleKey === "conflicting-source" && w.priority === "high",
      ),
    ).toBe(true);
  });
});
