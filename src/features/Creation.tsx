import { useEffect, useState } from "react";
import Papa from "papaparse";
import { calculateAll } from "../domain/calculations";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../app/Workspace";
import { newDraft, buildDashboard, uid } from "../app/workflow";
import type { Draft, KpiDefinition, Scenario } from "../domain/models";
import { recommendKpis } from "../domain/kpiDefinitions";
import {
  createSampleSources,
  getDefaultRanges,
} from "../domain/sampleScenarios";
import { suggestMappings } from "../domain/mappingRules";
import { parseFile, createDataSource } from "../infrastructure/parsers";
import { Sheet } from "../components/Sheet";
import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
const steps = ["context", "kpis", "upload", "mapping", "generating"];
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
  const [generation, setGeneration] = useState(0);
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
    let cancelled = false;
    setGeneration(0);
    const timer = setInterval(
      () => setGeneration((n) => Math.min(n + 1, 4)),
      220,
    );
    const finish = setTimeout(() => {
      if (cancelled) return;
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
    }, 1300);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(finish);
    };
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
    const fresh = newDraft(scenario);
    update({
      ...fresh,
      context: { ...fresh.context, position: draft.context.position },
    });
  };
  const changeKpi = (id: string, part: Partial<KpiDefinition>) =>
    update({
      definitions: draft.definitions.map((d) =>
        d.id === id ? { ...d, ...part } : d,
      ),
    });
  const loadSample = () => {
    const sources = createSampleSources(draft.context.scenario);
    update({
      sources,
      mappings: suggestMappings(sources, draft.definitions),
      ...getDefaultRanges(sources),
    });
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
    update({
      sources,
      mappings: suggestMappings(sources, draft.definitions),
      ...getDefaultRanges(sources),
    });
    setError(errors.join(" "));
    setBusy(false);
  };
  const next = () => {
    if (
      index === 0 &&
      [
        draft.context.industry,
        draft.context.sector,
        draft.context.position,
        draft.context.goal,
      ].some((v) => !v.trim())
    ) {
      setError("Complete the labeled context fields to continue.");
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
      const suggestions = suggestMappings(draft.sources, draft.definitions);
      update({
        mappings: suggestions.map((s) => {
          const old = draft.mappings.find(
            (m) => m.kpiId === s.kpiId && m.inputName === s.inputName,
          );
          return old &&
            draft.sources.some(
              (source) =>
                source.id === old.sourceId &&
                source.fieldNames.includes(old.sourceField),
            )
            ? old
            : s;
        }),
      });
    }
    if (index === 2 && !draft.sources.length) {
      setError("Load fictional sample data or choose a CSV/XLSX file.");
      return;
    }
    if (index === 3) {
      if (draft.mappings.some((m) => m.status === "suggested")) {
        setError(
          "Confirm each suggested mapping or choose “Leave unresolved”. Nothing is automatically confirmed.",
        );
        return;
      }
      if (!draft.mappings.some((m) => m.status === "confirmed")) {
        setError(
          "Confirm at least one valid mapping. Other KPIs may remain unavailable.",
        );
        return;
      }
      if (
        [draft.dateRange, draft.comparisonPeriod].some(
          (r) => !r.start || !r.end || r.start > r.end,
        )
      ) {
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
    }
    go(index + 1);
  };
  const options = [
    ...recommendKpis(draft.context.scenario),
    ...draft.definitions.filter((d) => d.custom),
  ];
  return (
    <Sheet
      title={titles[index]}
      eyebrow={`Create dashboard · ${index + 1} of 5`}
      onClose={close}
      footer={
        <div className="actions">
          {index > 0 && (
            <button
              className="secondary"
              onClick={() => go(index === 4 ? 3 : index - 1)}
            >
              Back
            </button>
          )}
          {index < 4 && (
            <button className="primary" disabled={busy} onClick={next}>
              {index === 3 ? "Generate dashboard" : "Continue"}
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
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === index ? "step" : undefined}
            className={i <= index ? "active" : ""}
          >
            {i + 1}
          </li>
        ))}
      </ol>
      {error && (
        <div role="alert" className="error">
          {error} Existing saved dashboards are safe.
        </div>
      )}
      {index === 0 && (
        <div className="stack">
          <p className="subtitle">
            Define KPIs. Add data. Get a clear, evidence-based view.
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
          {(
            [
              "companyOrProject",
              "industry",
              "sector",
              "position",
              "goal",
            ] as const
          ).map((k) => (
            <label className="field" key={k}>
              {
                {
                  companyOrProject: "Company or project",
                  industry: "Industry",
                  sector: "Sector / business area",
                  position: "Your position",
                  goal: "Decision or goal",
                }[k]
              }
              {k === "goal" ? (
                <textarea
                  maxLength={1000}
                  value={draft.context[k]}
                  onChange={(e) =>
                    update({
                      context: { ...draft.context, [k]: e.target.value },
                    })
                  }
                />
              ) : (
                <input
                  maxLength={150}
                  value={draft.context[k]}
                  onChange={(e) =>
                    update({
                      context: { ...draft.context, [k]: e.target.value },
                    })
                  }
                />
              )}
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
                  ],
                })
              }
            />
          </label>
          <p className="notice">
            Use fictional data only. The prototype runs in this browser.
          </p>
        </div>
      )}
      {index === 1 && (
        <div className="stack">
          <p>
            Choose your indicators and targets. Percentage targets use 0–100.
            Targets apply to the full selected reporting period.
          </p>
          <label className="field">
            Find a KPI
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
            />
          </label>
          {options
            .filter((k) => k.name.toLowerCase().includes(search.toLowerCase()))
            .map((k) => {
              const selected = draft.definitions.find((d) => d.id === k.id);
              return (
                <div className="panel stack" key={k.id}>
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
                    <>
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
                    </>
                  )}
                </div>
              );
            })}
          <p className="notice">
            Shortfall = adverse difference ÷ |target| × 100, adjusted for
            whether higher or lower is better. At a zero target, any adverse
            difference is critical. Thresholds do not imply statistical
            significance.
          </p>
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
            Use fictional sample data or small, non-confidential local files.
            Files are parsed in this browser.
          </p>
          <button className="primary" onClick={loadSample}>
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
                      mappings: suggestMappings(sources, draft.definitions),
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
          <DateFields draft={draft} update={update} />
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
                            const [sourceId = "", sourceField = ""] =
                              e.target.value.split("::");
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
                      <div className="actions">
                        <button
                          className="secondary"
                          disabled={!m.sourceField || m.status === "confirmed"}
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
                          {m.status === "confirmed"
                            ? "Confirmed"
                            : "Confirm mapping"}
                        </button>
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
                      </div>
                    </div>
                  ))
              )}
            </section>
          ))}
          <button
            className="secondary"
            onClick={() =>
              update({
                mappings: draft.mappings.map((m) =>
                  m.sourceId && m.sourceField
                    ? { ...m, status: "confirmed" }
                    : { ...m, status: "unresolved" },
                ),
              })
            }
          >
            Confirm all selected fields
          </button>
          <p className="notice">
            By confirming, you approve the selected fields above. Unmapped
            inputs remain unavailable. Review dates and missing values before
            using results.
          </p>
        </div>
      )}
      {index === 4 && (
        <div className="stack generation">
          <Icon name="trend" size={40} />
          <h3>From information to understanding.</h3>
          {[
            "Reading data",
            "Matching confirmed fields",
            "Calculating KPIs",
            "Checking quality",
            "Assembling dashboard",
          ].map((s, i) => (
            <p key={s} className={i <= generation ? "complete" : ""}>
              {i <= generation ? "✓" : "○"} {s}
            </p>
          ))}
          <p className="notice">
            Local rules and real calculations. No information is sent to AI.
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
