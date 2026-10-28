import type { DataMapping, DataSource, KpiDefinition } from "./models";
import { INPUT_ALIASES } from "./kpiDefinitions";
export const normalizeField = (field: string): string =>
  field
    .toLowerCase()
    .replace(/[_\W]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
export function fieldConfidence(field: string, input: string): number {
  const normalized = normalizeField(field);
  const aliases = INPUT_ALIASES[input] ?? [input];
  if (aliases.some((alias) => normalizeField(alias) === normalized))
    return 0.98;
  if (aliases.some((alias) => normalized.includes(normalizeField(alias))))
    return 0.6;
  return 0;
}
export function suggestMappings(
  sources: DataSource[],
  definitions: KpiDefinition[],
): DataMapping[] {
  return definitions.flatMap((definition) => {
    if (definition.custom) return [];
    const inputs = ["date", ...definition.requiredInputs];
    const ranked = sources
      .filter((s) => s.status !== "invalid")
      .map((source) => ({
        source,
        score: inputs.reduce(
          (sum, input) =>
            sum +
            Math.max(
              0,
              ...source.fieldNames.map((field) =>
                fieldConfidence(field, input),
              ),
            ),
          0,
        ),
      }))
      .sort((a, b) => b.score - a.score);
    const source = ranked[0]?.source;
    return inputs.map((inputName) => {
      const rankedFields = (source?.fieldNames ?? [])
        .map((sourceField) => ({
          sourceField,
          confidence: fieldConfidence(sourceField, inputName),
        }))
        .sort((a, b) => b.confidence - a.confidence);
      const best = rankedFields[0];
      const confidence = best?.confidence ?? 0;
      return {
        id: `${definition.id}:${inputName}`,
        sourceId: source?.id ?? "",
        sourceField: confidence > 0 ? best.sourceField : "",
        kpiId: definition.id,
        inputName,
        confidence,
        status:
          confidence > 0 ? ("suggested" as const) : ("unresolved" as const),
      };
    });
  });
}
