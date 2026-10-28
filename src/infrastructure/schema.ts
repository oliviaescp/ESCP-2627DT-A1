import { z } from "zod";
import type { Dashboard, Draft } from "../domain/models";

const text = z.string().max(20_000);
const id = z.string().min(1).max(300);
const finite = z.number().finite();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Invalid date",
  );
const timestamp = z.string().datetime();
const dateRange = z
  .object({ start: isoDate, end: isoDate })
  .refine((value) => value.start <= value.end, "Start must precede end");
const context = z.object({
  industry: text,
  sector: text,
  position: text,
  companyOrProject: text,
  goal: text,
  scenario: z.enum(["restaurant", "consulting"]),
});
const assumption = z.object({
  id,
  title: text,
  description: text,
  expectedOutcome: text,
  createdAt: timestamp,
  period: dateRange.optional(),
});
const definition = z
  .object({
    id,
    name: text,
    description: text,
    category: z.enum([
      "financial",
      "operational",
      "customer",
      "team",
      "project",
    ]),
    requiredInputs: z.array(text).max(50),
    formulaKey: text,
    unit: z.enum(["number", "currency", "percentage", "hours"]),
    direction: z.enum(["higher-is-better", "lower-is-better"]),
    target: finite.optional(),
    warningThreshold: finite.min(0),
    criticalThreshold: finite.min(0),
    period: z.enum(["day", "week", "month"]),
    custom: z.boolean().optional(),
  })
  .refine(
    (value) => value.criticalThreshold >= value.warningThreshold,
    "Critical threshold must be at least the warning threshold",
  );
const source = z
  .object({
    id,
    name: text,
    type: z.enum(["csv", "xlsx", "sample"]),
    isSample: z.boolean(),
    rowCount: z.number().int().min(0).max(5000),
    fieldNames: z.array(text).max(16_384),
    rows: z
      .array(
        z.record(
          z.string(),
          z.union([z.string(), finite, z.boolean(), z.null()]),
        ),
      )
      .max(5000),
    period: dateRange.optional(),
    uploadedAt: timestamp,
    freshness: z.enum(["current", "outdated", "unknown"]),
    status: z.enum(["valid", "needs-review", "invalid"]),
    warnings: z.array(text),
    sheets: z.array(text).optional(),
    selectedSheet: text.optional(),
  })
  .refine(
    (value) => value.rowCount === value.rows.length,
    "Saved row count is inconsistent",
  );
const mapping = z.object({
  id,
  sourceId: text,
  sourceField: text,
  kpiId: id,
  inputName: text,
  confidence: finite.min(0).max(1),
  status: z.enum(["suggested", "confirmed", "unresolved"]),
});
const reference = z.object({
  sourceId: id,
  sourceName: text,
  field: text,
  inputName: text,
  period: dateRange,
  rowCount: z.number().int().min(0),
  sheet: text.optional(),
});
const result = z.object({
  id,
  kpiId: id,
  name: text,
  unit: z.enum(["number", "currency", "percentage", "hours"]),
  value: finite.optional(),
  target: finite.optional(),
  variance: finite.optional(),
  variancePercent: finite.optional(),
  trend: z.enum(["up", "down", "stable", "unknown"]),
  status: z.enum(["on-track", "watch", "critical", "unavailable"]),
  period: dateRange,
  comparisonPeriod: dateRange.optional(),
  previousValue: finite.optional(),
  comparisonChange: finite.optional(),
  sourceReferences: z.array(reference),
  qualityNotes: z.array(text),
  formula: text,
  operands: z.record(z.string(), finite),
  series: z.array(z.object({ date: isoDate, value: finite })).max(5000),
});
const warning = z.object({
  id,
  kpiId: id.optional(),
  priority: z.enum(["low", "medium", "high"]),
  title: text,
  explanation: text,
  changedValues: z.array(text),
  impact: text.optional(),
  ruleKey: text,
  sourceReferences: z.array(reference),
  caveats: z.array(text),
  possibleNextStep: text.optional(),
});
const draftObject = z.object({
  context,
  assumptions: z.array(assumption).max(100),
  definitions: z.array(definition).max(100),
  sources: z.array(source).max(5),
  mappings: z.array(mapping).max(1000),
  dateRange,
  comparisonPeriod: dateRange,
  filters: z.record(z.string(), text),
});
export const draftSchema: z.ZodType<Draft> = draftObject;
export const dashboardSchema: z.ZodType<Dashboard> = draftObject.extend({
  id,
  name: text,
  kpiResults: z.array(result).max(100),
  warnings: z.array(warning).max(200),
  createdAt: timestamp,
  updatedAt: timestamp,
  chartType: z.enum(["line", "bar"]),
});
export const workspaceSchema = z.object({
  draft: draftSchema.nullable(),
  draftStep: z.number().int().min(0).max(10),
  dashboards: z.array(dashboardSchema).max(100),
  editingDashboardId: id.nullable().default(null),
  activeDashboardId: id.nullable(),
  theme: z.enum(["light", "dark", "system"]),
  freshnessDays: z.number().int().min(1).max(3650),
});
export type PersistedWorkspace = z.infer<typeof workspaceSchema>;
