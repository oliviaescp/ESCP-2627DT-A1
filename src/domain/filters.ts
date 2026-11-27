import type { DashboardFilters, DataSource, Draft } from "./models";

const dimensionName =
  /^(category|channel|client|customer|department|location|product|project|region|shift|status|team)(?:[ _-](?:name|type|status))?$|^(?:project|order|delivery)[ _-]status$/i;

export function filterLabel(field: string) {
  return field
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function filterValues(value: DashboardFilters[string] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value && value !== "*" ? [value] : [];
}

export function activeFilters(filters: DashboardFilters) {
  return Object.entries(filters)
    .map(([field, value]) => ({ field, values: filterValues(value) }))
    .filter(({ values }) => values.length > 0);
}

export function filterOptions(
  sources: DataSource[],
  mappings: Draft["mappings"],
) {
  const fields = new Map<string, Set<string>>();
  for (const source of sources) {
    if (source.status === "invalid") continue;
    const inputs = new Set(
      mappings
        .filter(
          (mapping) =>
            mapping.sourceId === source.id && mapping.status === "confirmed",
        )
        .map((mapping) => mapping.sourceField),
    );
    for (const field of source.fieldNames) {
      if (!dimensionName.test(field) || inputs.has(field)) continue;
      const choices = fields.get(field) ?? new Set<string>();
      for (const row of source.rows) {
        const value = row[field];
        if (
          (typeof value === "string" && value.trim()) ||
          typeof value === "number"
        ) {
          choices.add(String(value));
        }
      }
      if (choices.size) fields.set(field, choices);
    }
  }
  return Array.from(fields, ([field, choices]) => ({
    field,
    values: Array.from(choices).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    ),
  })).sort((a, b) => filterLabel(a.field).localeCompare(filterLabel(b.field)));
}
