import { useEffect, useState } from "react";
import Papa from "papaparse";
import { calculateAll, validRange } from "../domain/calculations";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../app/Workspace";
import {
  newDraft,
  buildDashboard,
  confirmFields,
  uid,
  withSampleData,
} from "../app/workflow";
import type { Draft, KpiDefinition, Scenario } from "../domain/models";
import { recommendKpis } from "../domain/kpiDefinitions";
import { getDefaultRanges } from "../domain/sampleScenarios";
import { suggestMappings } from "../domain/mappingRules";
import { parseFile, createDataSource } from "../infrastructure/parsers";
import { Sheet } from "../components/Sheet";
import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
const steps = ["context", "kpis", "upload", "mapping", "generating"];
const stepLabels = ["Decision", "KPIs", "Data", "Review"];
const titles = [
  "Start with a decision",
  "What matters to you?",
  "Bring your information",
  "Make the connections",
  "Building your dashboard",
];
export function Creation() {
  const { state, patch } = useWorkspace();
  const navigate = useNavigate();
  const { step = "context" } = useParams();
  const index = Math.max(0, steps.indexOf(step));
  const draft = state.draft;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState(false);
  const [search, setSearch] = useState("");
  const [goalError, setGoalError] = useState(false);
  useEffect(() => {
    if (!draft) {
      patch({ draft: newDraft(), draftStep: 0 });
      navigate("/onboarding/context", { replace: true });
    }
  }, []);
  useEffect(() => {
    setError("");
    setSearch("");
  }, [step]);
  useEffect(() => {
    if (index !== 4 || !draft) return;
    if (
      !draft.sources.length ||
      draft.mappings.some((m) => m.status === "suggested")
    ) {
      setError(
        "Confirm or mark every mapping unresolved before generation. Return to mapping; your draft is safe.",
      );
      return;
    }
    const finish = requestAnimationFrame(() => {
      try {
        const existing = state.dashboards.find(
          (d) => d.id === state.editingDashboardId,
        );
        const d = buildDashboard(
          draft,
          undefined,
          existing,
          state.freshnessDays,
        );
        patch({
          dashboards: [...state.dashboards.filter((x) => x.id !== d.id), d],
          activeDashboardId: d.id,
          draft: null,
          draftStep: 0,
          editingDashboardId: null,
        });
        navigate(`/dashboards/${d.id}`, { replace: true });
      } catch {
        setError(
          "Generation was interrupted. Your confirmed draft is safe. Return to mapping and retry.",
        );
      }
    });
    return () => cancelAnimationFrame(finish);
    // Snapshot the confirmed draft only when the generation route mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  if (!draft) return null;
  const update = (part: Partial<Draft>) =>
    patch({ draft: { ...draft, ...part } });
  const close = () => navigate("/");
  const go = (n: number) => {
    patch({ draftStep: n });
    navigate(`/onboarding/${steps[n]}`);
  };
  const setScenario = (scenario: Scenario) => {
    if (scenario === draft.context.scenario) return;
    const previous = newDraft(draft.context.scenario);
    const fresh = newDraft(scenario);
    const context = { ...draft.context, scenario };
    for (const field of [
      "industry",
      "sector",
      "companyOrProject",
      "goal",
    ] as const) {
      if (draft.context[field] === previous.context[field])
        context[field] = fresh.context[field];
    }
    const definitions =
      JSON.stringify(draft.definitions) === JSON.stringify(previous.definitions)
        ? fresh.definitions
        : draft.definitions;
    update({
      context,
      definitions,
      mappings: mergeMappings(draft.sources, definitions),
      assumptions:
        draft.assumptions.length === 1 &&
        draft.assumptions[0]?.expectedOutcome ===
          previous.assumptions[0].expectedOutcome
          ? fresh.assumptions
          : draft.assumptions,
    });
    setGoalError(false);
  };
  function mergeMappings(
    sources: Draft["sources"],
    definitions: Draft["definitions"],
  ) {
    return suggestMappings(sources, definitions).map((suggestion) => {
      const saved = draft?.mappings.find(
        (mapping) => mapping.id === suggestion.id,
      );
      return saved &&
        sources.some(
          (source) =>
            source.id === saved.sourceId &&
            source.fieldNames.includes(saved.sourceField),
        )
        ? saved
        : suggestion;
    });
  }
  const changeKpi = (id: string, part: Partial<KpiDefinition>) =>
    update({
      definitions: draft.definitions.map((d) =>
        d.id === id ? { ...d, ...part } : d,
      ),
    });
  const loadSample = () => {
    update(withSampleData(draft));
    setError("");
  };
  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    setError("");
    const sources = [...draft.sources];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (sources.length >= 5) {
        errors.push(
          "Maximum five files per dashboard. Remove a source before adding another.",
        );
        break;
      }
      if (sources.some((s) => s.name === file.name)) {
        errors.push(
          `${file.name} is already loaded. Remove it before replacing it.`,
        );
        continue;
      }
      try {
        const parsed = await parseFile(file);
        const source = createDataSource(parsed);
        sources.push(source);
      } catch (e) {
        errors.push(
          e instanceof Error
            ? e.message
            : "File could not be read. Try another CSV or XLSX.",
        );
      }
    }
    if (sources.length > draft.sources.length) {
      update({
        sources,
        mappings: mergeMappings(sources, draft.definitions),
        ...(draft.sources.length ? {} : getDefaultRanges(sources)),
      });
    }
    setError(errors.join(" "));
    setBusy(false);
  };
  const next = (approve = false) => {
    setError("");
    if (index === 0 && !draft.context.goal.trim()) {
      setGoalError(true);
      document.getElementById("dashboard-goal")?.focus();
      return;
    }
    if (index === 1) {
      if (!draft.definitions.length) {
        setError("Select at least one KPI.");
        return;
      }
      if (
        draft.definitions.some(
          (d) =>
            !Number.isFinite(d.warningThreshold) ||
            !Number.isFinite(d.criticalThreshold) ||
            d.warningThreshold < 0 ||
            d.criticalThreshold <= d.warningThreshold ||
            (d.target !== undefined && !Number.isFinite(d.target)),
        )
      ) {
        setError(
          "Targets must be numbers. Critical shortfall must exceed Watch shortfall (both at least zero).",
        );
        return;
      }
      update({ mappings: mergeMappings(draft.sources, draft.definitions) });
    }
    if (index === 2 && !draft.sources.length) {
      setError("Load fictional sample data or choose a CSV/XLSX file.");
      return;
    }
    if (index === 3) {
      const mappings = approve ? confirmFields(draft.mappings) : draft.mappings;
      if (mappings.some((m) => m.status === "suggested")) {
        setError(
          "Confirm each suggested mapping or choose “Leave unresolved”.",
        );
        return;
      }
      if (!mappings.some((m) => m.status === "confirmed")) {
        setError(
          "Confirm at least one valid mapping. Other KPIs may remain unavailable.",
        );
        return;
      }
      if (![draft.dateRange, draft.comparisonPeriod].every(validRange)) {
        setError("Choose valid reporting and comparison periods.");
        return;
      }
      if (
        draft.dateRange.start <= draft.comparisonPeriod.end &&
        draft.comparisonPeriod.start <= draft.dateRange.end
      ) {
        setError("Reporting and comparison periods must not overlap.");
        return;
      }
      update({ mappings });
    }
    go(index + 1);
  };
  const selectedKpis = new Set(draft.definitions.map((kpi) => kpi.id));
  const query = search.trim().toLowerCase();
  const options = [
    ...draft.definitions,
    ...recommendKpis(draft.context.scenario).filter(
      (kpi) => !selectedKpis.has(kpi.id),
    ),
  ].filter((kpi) =>
    `${kpi.name} ${kpi.category}`.toLowerCase().includes(query),
  );
  const suggested = draft.mappings.filter((m) => m.status === "suggested");
  const advancedDates = index === 3 && !!error && /periods/.test(error);
  return (
    <Sheet
      title={titles[index]}
      eyebrow={state.editingDashboardId ? "Edit dashboard" : "Create dashboard"}
      onClose={() => {
        if (!busy) close();
      }}
      footer={
        <div className="actions">
          {index > 0 && !(index === 4 && error) && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() => go(index - 1)}
            >
              Back
            </button>
          )}
          {index < 4 && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => next(suggested.length > 0)}
            >
              {index === 3
                ? suggested.length
                  ? "Confirm fields and generate"
                  : "Generate dashboard"
                : "Continue"}
              <Icon name="arrow" />
            </button>
          )}
          {index === 4 && error && (
            <button className="primary" onClick={() => go(3)}>
              Return to mapping
            </button>
          )}
        </div>
      }
    >
      <ol className="stepper" aria-label="Creation progress">
        {stepLabels.map((label, i) => (
          <li
            key={label}
            aria-current={i === index ? "step" : undefined}
            className={i <= index ? "active" : ""}
          >
            {label}
          </li>
        ))}
      </ol>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {index === 0 && (
        <div className="stack">
          <p className="subtitle">
            Pick a scenario for recommended KPIs. Then name the decision you
            want to track.
          </p>
          <div className="choice-grid">
            {(["restaurant", "consulting"] as const).map((s) => (
              <button
                key={s}
                className={`choice ${draft.context.scenario === s ? "selected" : ""}`}
                aria-pressed={draft.context.scenario === s}
                onClick={() => setScenario(s)}
              >
                <span className="choice-mark">
                  {s === "restaurant" ? "R" : "C"}
                </span>
                <strong>
                  {s === "restaurant" ? "Restaurant" : "Consulting"}
                </strong>
                <small>Fictional {s} scenario</small>
              </button>
            ))}
          </div>
          <label className="field">
            <span id="company-label">Company or project</span>
            <input
              aria-labelledby="company-label"
              aria-describedby="company-hint"
              maxLength={150}
              value={draft.context.companyOrProject}
              onChange={(e) =>
                update({
                  context: {
                    ...draft.context,
                    companyOrProject: e.target.value,
                  },
                })
              }
            />
            <small id="company-hint">
              Optional. This becomes the dashboard name.
            </small>
          </label>
          <label className="field" htmlFor="dashboard-goal">
            <span id="goal-label">Decision or goal</span>
            <textarea
              id="dashboard-goal"
              maxLength={1000}
              required
              value={draft.context.goal}
              aria-labelledby="goal-label"
              aria-invalid={goalError}
              aria-describedby={goalError ? "goal-error" : "goal-hint"}
              onChange={(e) => {
                update({ context: { ...draft.context, goal: e.target.value } });
                if (e.target.value.trim()) setGoalError(false);
              }}
            />
            {goalError ? (
              <small id="goal-error" className="field-error" role="alert">
                Enter a decision or goal to continue.
              </small>
            ) : (
              <small id="goal-hint">
                Required. For example, “Decide whether to open a second
                location.”
              </small>
            )}
          </label>
          <details className="setup-advanced">
            <summary>Advanced context</summary>
            <div className="stack">
              {(
                [
                  ["industry", "Industry"],
                  ["sector", "Sector / business area"],
                  ["position", "Your position"],
                ] as const
              ).map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <input
                    maxLength={150}
                    value={draft.context[key]}
                    onChange={(e) =>
                      update({
                        context: { ...draft.context, [key]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
              <label className="field">
                Original assumption
                <textarea
                  maxLength={1000}
                  value={draft.assumptions[0]?.expectedOutcome ?? ""}
                  onChange={(e) =>
                    update({
                      assumptions: [
                        {
                          id: draft.assumptions[0]?.id ?? uid(),
                          title: "Decision assumption",
                          description: draft.context.goal,
                          expectedOutcome: e.target.value,
                          createdAt:
                            draft.assumptions[0]?.createdAt ??
                            new Date().toISOString(),
                        },
                        ...draft.assumptions.slice(1),
                      ],
                    })
                  }
                />
              </label>
            </div>
          </details>
          <p className="notice">
            Use fictional data only. The prototype runs in this browser.
          </p>
        </div>
      )}
      {index === 1 && (
        <div className="stack">
          <div className="setup-summary">
            <p role="status">
              <strong>{draft.definitions.length} selected</strong> · Choose at
              least one KPI. You can change targets later.
            </p>
          </div>
          <label className="field">
            Find a KPI
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
            />
          </label>
          {!options.length && (
            <p className="notice">
              No KPIs match that search. Try a metric name or category.
            </p>
          )}
          {options.map((k) => {
            const selected = draft.definitions.find((d) => d.id === k.id);
            return (
              <div className="stack kpi-option" key={k.id}>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={(e) =>
                      update({
                        definitions: e.target.checked
                          ? [...draft.definitions, k]
                          : draft.definitions.filter((x) => x.id !== k.id),
                      })
                    }
                  />
                  <strong>{k.name}</strong>
                </label>
                <p className="subtitle">{k.description}</p>
                {selected && (
                  <details className="setup-advanced">
                    <summary>Targets and alerts for {k.name}</summary>
                    <div className="stack">
                      <small>
                        Targets apply to the whole reporting period. Enter
                        percentages as 0–100.
                      </small>
                      <label className="field">
                        Target for {k.name}
                        <input
                          type="number"
                          step="any"
                          value={selected.target ?? ""}
                          onChange={(e) =>
                            changeKpi(k.id, {
                              target:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <div className="two-fields">
                        <label className="field">
                          Watch shortfall %
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={selected.warningThreshold}
                            onChange={(e) =>
                              changeKpi(k.id, {
                                warningThreshold: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label className="field">
                          Critical shortfall %
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={selected.criticalThreshold}
                            onChange={(e) =>
                              changeKpi(k.id, {
                                criticalThreshold: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>
                      <small>
                        Shortfall is measured against the target. Any adverse
                        difference from a zero target is critical.
                      </small>
                      <div className="actions">
                        <button
                          className="secondary"
                          disabled={draft.definitions[0]?.id === k.id}
                          onClick={() => {
                            const defs = [...draft.definitions];
                            const i = defs.findIndex((d) => d.id === k.id);
                            [defs[i - 1], defs[i]] = [defs[i], defs[i - 1]];
                            update({ definitions: defs });
                          }}
                        >
                          Move {k.name} up
                        </button>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
          <button className="secondary" onClick={() => setCustom(!custom)}>
            {custom ? "Cancel custom KPI" : "Add custom KPI"}
          </button>
          {custom && (
            <CustomKpi
              onAdd={(k) => {
                update({ definitions: [...draft.definitions, k] });
                setCustom(false);
              }}
            />
          )}
        </div>
      )}
      {index === 2 && (
        <div className="stack">
          <p>
            Load a fictional sample or choose your own fictional CSV or XLSX
            files. Next you’ll check which columns feed each KPI.
          </p>
          <button className="secondary" disabled={busy} onClick={loadSample}>
            {draft.sources.length ? "Replace sources with" : "Load"} fictional{" "}
            {draft.context.scenario} data
          </button>
          <p className="notice">
            CSV or XLSX · 2 MB per file · 5,000 rows per file · 5 files per
            dashboard. Legacy XLS is not supported. XLSX expansion is limited to
            20 MB / 1,000 archive entries. Raw files are not retained.
          </p>
          <label className="field">
            Choose CSV or XLSX files
            <input
              type="file"
              accept=".csv,.xlsx"
              multiple
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {busy && <p role="status">Reading and validating files…</p>}
          {draft.sources.map((s) => (
            <div key={s.id} className="panel stack">
              <strong>{s.name}</strong>
              <Badge status={s.isSample ? "sample" : "unavailable"}>
                {s.isSample ? "Fictional sample" : "Local upload"}
              </Badge>
              <p>
                {s.rowCount} rows · {s.fieldNames.length} fields
                {s.selectedSheet ? ` · Sheet: ${s.selectedSheet}` : ""}
              </p>
              <p className="subtitle">{s.fieldNames.join(", ")}</p>
              {s.warnings.map((w, i) => (
                <p className="notice" key={i}>
                  {w}
                </p>
              ))}
              {(s.sheets?.length ?? 0) > 1 && (
                <p className="notice">
                  First worksheet selected. To use another sheet, export that
                  sheet as CSV and replace this source.
                </p>
              )}
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => {
                    const csv = Papa.unparse({
                      fields: s.fieldNames,
                      data: s.rows.map((r) =>
                        s.fieldNames.map((f) => r[f] ?? ""),
                      ),
                    });
                    const url = URL.createObjectURL(
                      new Blob([csv], { type: "text/csv" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = s.name.replace(/\.xlsx$/, ".csv");
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 500);
                  }}
                >
                  Download parsed CSV
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    const sources = draft.sources.filter((x) => x.id !== s.id);
                    update({
                      sources,
                      mappings: mergeMappings(sources, draft.definitions),
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {index === 3 && (
        <div className="stack">
          <p>
            Suggestions are based on field-name aliases. Check the original
            fields and confirm every connection; low confidence is never
            accepted automatically.
          </p>
          <div className="setup-summary" aria-label="Mapping status">
            <p>
              <strong>
                {draft.mappings.filter((m) => m.status === "confirmed").length}{" "}
                confirmed
              </strong>{" "}
              · {suggested.length} to confirm ·{" "}
              {draft.mappings.filter((m) => m.status === "unresolved").length}{" "}
              unresolved
            </p>
            {suggested.length > 0 && (
              <p>
                “Confirm fields and generate” approves the selected source
                fields shown below.
              </p>
            )}
          </div>
          <details className="setup-advanced" open={advancedDates || undefined}>
            <summary>Reporting and comparison dates</summary>
            <DateFields draft={draft} update={update} />
          </details>
          <section className="notice" aria-label="KPI data coverage">
            <h3>KPI data coverage</h3>
            {calculateAll(draft).map((result) => (
              <p key={result.kpiId}>
                <strong>{result.name}</strong>:{" "}
                {result.status === "unavailable"
                  ? result.qualityNotes[0]
                  : "Ready to calculate from the confirmed fields and selected period."}
              </p>
            ))}
          </section>
          {draft.definitions.map((k) => (
            <section className="panel stack" key={k.id}>
              <h3>{k.name}</h3>
              {k.custom ? (
                <p className="notice">
                  Metadata only — no formula is defined. This KPI will be
                  unavailable.
                </p>
              ) : (
                draft.mappings
                  .filter((m) => m.kpiId === k.id)
                  .map((m) => (
                    <div key={m.id} className="mapping-row stack">
                      <strong>{m.inputName.replaceAll("_", " ")}</strong>
                      <label className="field">
                        Source field for {k.name} / {m.inputName}
                        <select
                          value={
                            m.sourceId && m.sourceField
                              ? `${m.sourceId}::${m.sourceField}`
                              : ""
                          }
                          onChange={(e) => {
                            const selectedField = e.target.value;
                            const divider = selectedField.indexOf("::");
                            const sourceId =
                              divider < 0
                                ? ""
                                : selectedField.slice(0, divider);
                            const sourceField =
                              divider < 0
                                ? ""
                                : selectedField.slice(divider + 2);
                            update({
                              mappings: draft.mappings.map((x) =>
                                x.id === m.id
                                  ? {
                                      ...x,
                                      sourceId,
                                      sourceField,
                                      status: sourceField
                                        ? "suggested"
                                        : "unresolved",
                                      confidence: 0,
                                    }
                                  : x,
                              ),
                            });
                          }}
                        >
                          <option value="">No mapping</option>
                          {draft.sources.flatMap((s) =>
                            s.fieldNames.map((f) => (
                              <option
                                key={`${s.id}:${f}`}
                                value={`${s.id}::${f}`}
                              >
                                {s.name} → {f}
                              </option>
                            )),
                          )}
                        </select>
                      </label>
                      <small>
                        {m.confidence > 0
                          ? `${Math.round(m.confidence * 100)}% alias confidence · `
                          : ""}
                        {m.status}
                      </small>
                      {m.sourceField && (
                        <div className="actions">
                          {m.status !== "confirmed" && (
                            <button
                              className="secondary"
                              onClick={() =>
                                update({
                                  mappings: draft.mappings.map((x) =>
                                    x.id === m.id
                                      ? { ...x, status: "confirmed" }
                                      : x,
                                  ),
                                })
                              }
                            >
                              Confirm mapping
                            </button>
                          )}
                          {m.status !== "unresolved" && (
                            <button
                              className="text-button"
                              onClick={() =>
                                update({
                                  mappings: draft.mappings.map((x) =>
                                    x.id === m.id
                                      ? { ...x, status: "unresolved" }
                                      : x,
                                  ),
                                })
                              }
                            >
                              Leave unresolved
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </section>
          ))}
          {suggested.length > 0 && (
            <button
              className="secondary"
              onClick={() =>
                update({ mappings: confirmFields(draft.mappings) })
              }
            >
              Confirm all selected fields
            </button>
          )}
          <p className="notice">
            By confirming, you approve the selected fields above. Unmapped
            inputs remain unavailable. Review dates and missing values before
            using results.
          </p>
        </div>
      )}
      {index === 4 && !error && (
        <div className="stack generation" role="status">
          <Icon name="trend" size={32} />
          <p>
            Calculating KPIs from your confirmed fields and checking the
            reporting periods.
          </p>
        </div>
      )}
    </Sheet>
  );
}
function DateFields({
  draft,
  update,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
}) {
  return (
    <div className="panel stack">
      {(["dateRange", "comparisonPeriod"] as const).map((key) => (
        <fieldset key={key}>
          <legend>
            {key === "dateRange" ? "Reporting period" : "Comparison period"}
          </legend>
          <div className="two-fields">
            {(["start", "end"] as const).map((bound) => (
              <label className="field" key={bound}>
                {bound === "start" ? "From" : "To"}
                <input
                  type="date"
                  value={draft[key][bound]}
                  onChange={(e) =>
                    update({
                      [key]: { ...draft[key], [bound]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
function CustomKpi({ onAdd }: { onAdd: (k: KpiDefinition) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<KpiDefinition["unit"]>("number");
  const [period, setPeriod] = useState<KpiDefinition["period"]>("month");
  return (
    <div className="panel stack">
      <h3>Custom KPI definition</h3>
      <p className="notice">
        Metadata only. This prototype has no custom formula builder and will
        never invent a value.
      </p>
      <label className="field">
        Custom KPI name
        <input
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="field">
        Definition
        <textarea
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="field">
        Unit
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as KpiDefinition["unit"])}
        >
          {["number", "currency", "percentage", "hours"].map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Reporting cadence
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as KpiDefinition["period"])}
        >
          {["day", "week", "month"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <button
        className="primary"
        disabled={!name.trim() || !description.trim()}
        onClick={() =>
          onAdd({
            id: uid(),
            name: name.trim(),
            description,
            unit,
            period,
            custom: true,
            category: "operational",
            formulaKey: "custom",
            requiredInputs: [],
            direction: "higher-is-better",
            warningThreshold: 5,
            criticalThreshold: 10,
          })
        }
      >
        Add definition
      </button>
    </div>
  );
}
