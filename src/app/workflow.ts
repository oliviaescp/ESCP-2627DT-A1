import type { DataSource, Dashboard, Draft, Scenario } from "../domain/models";
import { recommendKpis } from "../domain/kpiDefinitions";
import { calculateAll } from "../domain/calculations";
import { generateWarnings } from "../domain/warningRules";
export const uid = () => crypto.randomUUID();
export function newDraft(scenario: Scenario = "restaurant"): Draft {
  return {
    context: {
      industry:
        scenario === "restaurant" ? "Hospitality" : "Professional services",
      sector:
        scenario === "restaurant" ? "Independent restaurant" : "Consulting",
      position: "Manager",
      companyOrProject:
        scenario === "restaurant"
          ? "Northstar Kitchen"
          : "Northstar Consulting",
      goal:
        scenario === "restaurant"
          ? "Assess readiness to open a second location"
          : "Improve delivery while maintaining team capacity",
      scenario,
    },
    assumptions: [
      {
        id: uid(),
        title:
          scenario === "restaurant" ? "Menu relaunch" : "Delivery improvement",
        description: "Original decision rationale",
        expectedOutcome:
          scenario === "restaurant"
            ? "Grow monthly revenue by 10% without increasing the food cost ratio."
            : "Reach 80% project completion and 75% utilization.",
        createdAt: new Date().toISOString(),
      },
    ],
    definitions: recommendKpis(scenario).slice(0, 4),
    sources: [],
    mappings: [],
    dateRange: { start: "2026-06-01", end: "2026-06-30" },
    comparisonPeriod: { start: "2026-05-01", end: "2026-05-31" },
    filters: {},
  };
}
export function buildDashboard(
  draft: Draft,
  name?: string,
  existing?: Dashboard,
  freshnessDays = 45,
): Dashboard {
  const now = new Date().toISOString();
  const kpiResults = calculateAll(draft);
  return {
    ...draft,
    id: existing?.id ?? uid(),
    name:
      name?.trim() ||
      draft.context.companyOrProject.trim() ||
      "Untitled dashboard",
    kpiResults,
    warnings: generateWarnings(
      kpiResults,
      draft.sources,
      draft.definitions,
      new Date().toISOString(),
      freshnessDays,
    ),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    chartType: existing?.chartType ?? "line",
  };
}
export function removeSource(d: Draft, id: string): Draft {
  return {
    ...d,
    sources: d.sources.filter((s) => s.id !== id),
    mappings: d.mappings.filter((m) => m.sourceId !== id),
  };
}
export function allSources(
  dashboards: Dashboard[],
  draft: Draft | null,
): DataSource[] {
  return [
    ...new Map(
      [...dashboards.flatMap((d) => d.sources), ...(draft?.sources ?? [])].map(
        (s) => [s.id, s],
      ),
    ).values(),
  ];
}
