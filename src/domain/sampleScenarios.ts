import type { DataSource, DateRange, Scenario, UserContext } from "./models";
import { parseDate } from "./calculations";
export function sampleContext(scenario: Scenario): UserContext {
  return scenario === "restaurant"
    ? {
        scenario,
        industry: "Hospitality",
        sector: "Independent restaurant",
        position: "Restaurant manager",
        companyOrProject: "Northstar Kitchen",
        goal: "Assess whether we are ready to open a second location",
      }
    : {
        scenario,
        industry: "Professional services",
        sector: "Consulting",
        position: "Team manager",
        companyOrProject: "Northstar Advisory",
        goal: "Improve delivery performance while protecting team capacity",
      };
}
const restaurantRows = [
  ["2026-05-01", 108000, 32400, 2600, 1092, 23000, 8.2],
  ["2026-06-01", 112000, 34720, 2700, 1134, 25000, 8.1],
  ["2026-07-01", 116000, 37120, 2750, 1155, 27000, 8.0],
  ["2026-08-01", 120000, 39000, 2800, 1176, 29000, 7.9],
  ["2026-09-01", 125880, 41540.4, 2950, 1387, 31000, 8.2],
  ["2026-10-01", 128400, 43912.8, 3000, 1254, 33000, 7.6],
];
export function createSampleSources(scenario: Scenario): DataSource[] {
  const restaurant = scenario === "restaurant";
  const fieldNames = restaurant
    ? [
        "date",
        "revenue",
        "food_cost",
        "customers",
        "repeat_customers",
        "delivery_revenue",
        "employee_satisfaction",
      ]
    : [
        "date",
        "project",
        "revenue",
        "completed_projects",
        "total_projects",
        "billable_hours",
        "available_hours",
        "client_satisfaction",
        "overdue_tasks",
      ];
  const data = restaurant
    ? restaurantRows
    : [
        ["2026-09-01", "Atlas", 40000, 1, 1, 100, 140, 8.5, 1],
        ["2026-09-01", "Cedar", 35000, 1, 1, 110, 140, 8, 2],
        ["2026-09-01", "Willow", 20000, 0, 1, 90, 120, 8.2, 1],
        ["2026-10-01", "Atlas", 45000, 1, 1, 110, 150, 8.1, 2],
        ["2026-10-01", "Cedar", 30000, 1, 1, 100, 150, 7.7, 3],
        ["2026-10-01", "Willow", 25000, 0, 1, 70, 120, 7.8, 4],
      ];
  return [
    {
      id: `sample-${scenario}`,
      name: `${scenario}_fictional_2026.csv`,
      type: "sample",
      isSample: true,
      rowCount: data.length,
      fieldNames,
      rows: data.map((row) =>
        Object.fromEntries(fieldNames.map((field, i) => [field, row[i]])),
      ),
      period: {
        start: restaurant ? "2026-05-01" : "2026-09-01",
        end: "2026-10-31",
      },
      uploadedAt: "2026-10-28T10:00:00Z",
      freshness: "current",
      status: "valid",
      warnings: [
        "Fictional demonstration data. Monthly records use the first day of each month; the final month is a demonstration, not live results.",
      ],
    },
  ];
}
export function getDefaultRanges(sources: DataSource[]): {
  dateRange: DateRange;
  comparisonPeriod: DateRange;
} {
  const dates = sources
    .flatMap((source) =>
      source.rows.map(
        (row) =>
          Object.entries(row).find(([key]) =>
            /^(date|month|period)$/i.test(key),
          )?.[1],
      ),
    )
    .map(parseDate)
    .filter((d): d is string => !!d)
    .sort();
  const latest = dates.at(-1) ?? "2026-10-01";
  const year = Number(latest.slice(0, 4)),
    month = Number(latest.slice(5, 7));
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const previousStart = new Date(Date.UTC(year, month - 2, 1))
    .toISOString()
    .slice(0, 10);
  const previousEnd = new Date(Date.UTC(year, month - 1, 0))
    .toISOString()
    .slice(0, 10);
  return {
    dateRange: { start, end },
    comparisonPeriod: { start: previousStart, end: previousEnd },
  };
}
