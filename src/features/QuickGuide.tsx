import { useMemo, useRef, useState, type ReactNode } from "react";
import { useWorkspace } from "../app/Workspace";
import {
  buildDashboard,
  confirmFields,
  newDraft,
  withSampleData,
} from "../app/workflow";
import { Icon } from "../components/Icon";
import { Sheet } from "../components/Sheet";
import { filterLabel, filterOptions } from "../domain/filters";
import { recommendKpis } from "../domain/kpiDefinitions";
import type { Dashboard, Scenario } from "../domain/models";
import { getDefaultRanges } from "../domain/sampleScenarios";
import { GuideDashboard, GuideSource } from "./GuidePreview";

const lessons = [
  ["Scenario", "Choose a business"],
  ["KPIs", "Build your KPI view"],
  ["Source", "Connect the revenue column"],
  ["Filters", "Change the reporting view"],
  ["Evidence", "Trace a result"],
  ["Check", "Check your understanding"],
  ["Finish", "Take your dashboard further"],
] as const;

const sampleScenarios = [
  {
    id: "restaurant",
    label: "Restaurant",
    description:
      "Track a restaurant’s sales, food costs, and repeat customers.",
  },
  {
    id: "consulting",
    label: "Consulting",
    description: "Track project revenue, delivery, and team capacity.",
  },
] satisfies { id: Scenario; label: string; description: string }[];

const answers = [
  ["evidence", "Open its evidence"],
  ["target", "Change the target"],
  ["chart", "Switch the chart style"],
] as const;

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const initialPractice = {
  scenario: null as Scenario | null,
  metrics: [] as string[],
  revenueField: "",
  earlier: false,
  project: "",
  inspected: "",
  answer: "",
};

export function QuickGuide({
  onOpenPractice,
}: {
  onOpenPractice: (dashboard: Dashboard) => void;
}) {
  const { state, patch } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState(initialPractice);
  const [error, setError] = useState("");
  const opener = useRef<HTMLButtonElement>(null);
  const started = practice.scenario !== null;
  const scenario = practice.scenario ?? "restaurant";

  const { options, sample, earlierPeriods } = useMemo(() => {
    const [lead, ...options] = recommendKpis(scenario);
    const draft = newDraft(scenario);
    const sample = withSampleData({
      ...draft,
      definitions: [
        lead,
        ...options.filter((metric) => practice.metrics.includes(metric.id)),
      ],
    });
    const source = sample.sources[0];
    const earlierPeriods = getDefaultRanges([
      {
        ...source,
        rows: source.rows.filter(
          (row) => String(row.date) < sample.dateRange.start,
        ),
      },
    ]);
    return { options, sample, earlierPeriods };
  }, [scenario, practice.metrics]);

  const source = sample.sources[0];
  const revenueMapping = sample.mappings.find(
    (mapping) =>
      mapping.kpiId === sample.definitions[0].id &&
      mapping.inputName === "revenue",
  );
  const confirmedField = revenueMapping?.sourceField;
  const fields = source.fieldNames
    .filter(
      (field) =>
        field !== confirmedField && typeof source.rows[0][field] === "number",
    )
    .slice(0, 2);
  if (confirmedField) fields.push(confirmedField);
  fields.sort();
  const needsMapping = step >= 2 && practice.revenueField !== confirmedField;
  const confirmedMappings = useMemo(
    () =>
      confirmFields(
        sample.mappings.map((mapping) =>
          mapping === revenueMapping && needsMapping
            ? { ...mapping, status: "unresolved" }
            : mapping,
        ),
      ),
    [sample, revenueMapping, needsMapping],
  );

  const dashboard = useMemo(
    () =>
      buildDashboard(
        {
          ...sample,
          ...(practice.earlier ? earlierPeriods : {}),
          mappings: confirmedMappings,
          filters: practice.project ? { project: [practice.project] } : {},
        },
        undefined,
        undefined,
        state.freshnessDays,
      ),
    [
      sample,
      earlierPeriods,
      confirmedMappings,
      practice.earlier,
      practice.project,
      state.freshnessDays,
    ],
  );
  const projects = filterOptions(sample.sources, confirmedMappings).find(
    (field) => field.field === "project",
  )?.values;
  const evidence =
    step === 4
      ? dashboard.kpiResults.find(
          (result) => result.kpiId === practice.inspected,
        )
      : undefined;
  const month = (date: string) => monthFormat.format(new Date(date));

  function choose(change: Partial<typeof practice>) {
    setPractice({ ...practice, ...change });
    setError("");
  }

  function goTo(next: number) {
    setError("");
    setStep(next);
  }

  function finish() {
    patch({ guideSeen: true });
    setOpen(false);
    setPractice(initialPractice);
    goTo(0);
    requestAnimationFrame(() => opener.current?.focus());
  }

  function next() {
    const issue = [
      !practice.scenario && "Choose a business to start.",
      !practice.metrics.length &&
        "Choose at least one more KPI to track beside revenue.",
      practice.revenueField !== confirmedField &&
        "Choose the source column that holds total revenue. Check the sample rows for a clue.",
      !practice.earlier &&
        !practice.project &&
        (projects
          ? "Change the reporting month or select a project to see the numbers update."
          : "Change the reporting month to see the numbers update."),
      !practice.inspected && "Open a KPI’s evidence in the practice dashboard.",
      practice.answer !== "evidence" &&
        "Think about which action lets you check the calculation and source first.",
    ][step];
    if (issue) {
      setError(issue);
      return;
    }
    if (step + 1 === lessons.length) finish();
    else goTo(step + 1);
  }

  const exercises: ReactNode[] = [
    <fieldset className="guide-options">
      <legend>Practice scenario</legend>
      {sampleScenarios.map(({ id, label, description }) => (
        <label className="guide-option" key={id}>
          <input
            type="radio"
            name="guide-scenario"
            checked={practice.scenario === id}
            onChange={() => choose({ ...initialPractice, scenario: id })}
          />
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
        </label>
      ))}
    </fieldset>,
    <fieldset className="guide-options">
      <legend>Track {sample.definitions[0].name.toLowerCase()} plus</legend>
      {options.map(({ id, name }) => (
        <label className="guide-option" key={id}>
          <input
            type="checkbox"
            checked={practice.metrics.includes(id)}
            onChange={(event) =>
              choose({
                metrics: event.target.checked
                  ? [...practice.metrics, id]
                  : practice.metrics.filter((metric) => metric !== id),
                inspected: "",
              })
            }
          />
          <strong>{name}</strong>
        </label>
      ))}
    </fieldset>,
    <label className="field">
      Revenue column
      <select
        value={practice.revenueField}
        aria-invalid={!!error}
        aria-describedby={error ? "quick-guide-error" : undefined}
        onChange={(event) =>
          choose({ revenueField: event.target.value, inspected: "" })
        }
      >
        <option value="">Choose a source column</option>
        {fields.map((field) => (
          <option key={field} value={field}>
            {filterLabel(field)}
          </option>
        ))}
      </select>
    </label>,
    <>
      <label className="field">
        Reporting month
        <select
          value={practice.earlier ? "earlier" : "latest"}
          onChange={(event) =>
            choose({ earlier: event.target.value === "earlier", inspected: "" })
          }
        >
          <option value="latest">{month(sample.dateRange.start)}</option>
          <option value="earlier">
            {month(earlierPeriods.dateRange.start)}
          </option>
        </select>
      </label>
      {projects && (
        <label className="field">
          Project
          <select
            value={practice.project}
            onChange={(event) =>
              choose({ project: event.target.value, inspected: "" })
            }
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>
      )}
    </>,
    evidence && (
      <p className="guide-feedback" role="status">
        <Icon name="check" /> Evidence opened for {evidence.name}.
      </p>
    ),
    <fieldset className="guide-options">
      <legend>A KPI surprises you. What should you do first?</legend>
      {answers.map(([id, label]) => (
        <label className="guide-option" key={id}>
          <input
            type="radio"
            name="guide-answer"
            checked={practice.answer === id}
            onChange={() => choose({ answer: id })}
          />
          <strong>{label}</strong>
        </label>
      ))}
      {practice.answer === "evidence" && (
        <p className="guide-feedback" role="status">
          <Icon name="check" /> Evidence shows which source, rows, and formula
          produced the result.
        </p>
      )}
    </fieldset>,
    <div className="guide-finish">
      <p>
        Open your practice dashboard to keep exploring its AI summary, dates,
        filters, and warnings. This saves a copy with your choices.
      </p>
      <button
        className="secondary"
        onClick={() => {
          finish();
          onOpenPractice({
            ...dashboard,
            name: `${dashboard.name} (practice)`,
          });
        }}
      >
        Open practice dashboard <Icon name="arrow" />
      </button>
    </div>,
  ];

  const instructions = [
    "Pick the fictional business you want to explore. The preview switches to that business.",
    "Choose the indicators that help you answer a business question. Each one appears in your preview.",
    "Use the sample CSV to find the column that should feed total revenue.",
    projects
      ? "Change the month or narrow the data to one project. Watch the KPI values update."
      : "Change the reporting month and watch the KPI values update.",
    "Select an evidence button in the practice dashboard to see the formula and where its inputs came from.",
    "Choose the best next action for a result you want to verify.",
    "You’ve selected KPIs, checked a source mapping, filtered a result, and traced a calculation.",
  ];

  return (
    <div className="quick-guide-slot">
      {state.guideSeen ? (
        <button
          ref={opener}
          className="text-button quick-guide-reopen"
          onClick={() => setOpen(true)}
        >
          {started ? "Resume guide" : "Quick guide"}
        </button>
      ) : (
        <section className="quick-guide" aria-label="Quick guide">
          <div className="quick-guide-copy">
            <h2>Explore a dashboard hands-on</h2>
            <p>
              Practice with a fictional business before setting up your own
              dashboard.
            </p>
          </div>
          <div className="actions quick-guide-actions">
            <button
              ref={opener}
              className="primary"
              onClick={() => setOpen(true)}
            >
              {started ? "Resume guide" : "Start guide"} <Icon name="arrow" />
            </button>
            <button className="text-button" onClick={finish}>
              Skip guide
            </button>
          </div>
        </section>
      )}
      {open && (
        <Sheet
          className="guide-sheet"
          title={lessons[step][1]}
          eyebrow={`Quick guide · ${step + 1} of ${lessons.length}`}
          onClose={() => setOpen(false)}
          footer={
            <div className="guide-controls">
              <button className="text-button" onClick={() => setOpen(false)}>
                Pause guide
              </button>
              <div className="actions">
                {step > 0 && (
                  <button className="secondary" onClick={() => goTo(step - 1)}>
                    Back
                  </button>
                )}
                <button className="primary" onClick={next}>
                  {step + 1 === lessons.length ? "Done" : "Continue"}{" "}
                  <Icon
                    name={step + 1 === lessons.length ? "check" : "arrow"}
                  />
                </button>
              </div>
            </div>
          }
        >
          <ol className="guide-progress" aria-label="Guide steps">
            {lessons.map(([label], index) => (
              <li
                key={label}
                data-complete={index < step}
                aria-current={index === step ? "step" : undefined}
              >
                <span aria-hidden="true">
                  {index < step ? <Icon name="check" size={14} /> : index + 1}
                </span>{" "}
                {label}
              </li>
            ))}
          </ol>
          <div className="guide-layout" key={step}>
            <div className="guide-exercise">
              <p>{instructions[step]}</p>
              {exercises[step]}
              {error && (
                <p className="error" id="quick-guide-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            {step === 2 ? (
              <GuideSource source={source} fields={fields} />
            ) : (
              <GuideDashboard
                dashboard={dashboard}
                reportingMonth={month(dashboard.dateRange.start)}
                onInspect={
                  step === 4
                    ? (result) => choose({ inspected: result.kpiId })
                    : undefined
                }
                evidence={evidence}
              />
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
