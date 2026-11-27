import { useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Sheet } from "../components/Sheet";
import {
  activeFilters,
  filterLabel,
  filterOptions,
  filterValues,
} from "../domain/filters";
import { parseDate, validRange } from "../domain/calculations";
import type {
  Dashboard,
  DashboardFilters as Selections,
  DateRange,
} from "../domain/models";

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function showPeriod(range: DateRange) {
  return validRange(range)
    ? dateLabel.formatRange(new Date(range.start), new Date(range.end))
    : "Unavailable";
}

function monthRanges(end: string, months: number) {
  const year = Number(end.slice(0, 4));
  const month = Number(end.slice(5, 7));
  const iso = (offset: number, day: number) =>
    new Date(Date.UTC(year, month - 1 + offset, day))
      .toISOString()
      .slice(0, 10);
  return {
    dateRange: { start: iso(1 - months, 1), end: iso(1, 0) },
    comparisonPeriod: {
      start: iso(1 - 2 * months, 1),
      end: iso(1 - months, 0),
    },
  };
}

function availablePeriods({ sources, mappings }: Dashboard) {
  let first = "";
  let last = "";
  for (const source of sources) {
    const dateFields = [
      ...new Set(
        mappings
          .filter(
            (m) =>
              m.inputName === "date" &&
              m.status === "confirmed" &&
              m.sourceId === source.id,
          )
          .map((m) => m.sourceField),
      ),
    ];
    const dates = dateFields.length
      ? source.rows.flatMap((row) =>
          dateFields.map((field) => parseDate(row[field])),
        )
      : [source.period?.start, source.period?.end];
    for (const date of dates) {
      if (!date) continue;
      if (!first || date < first) first = date;
      if (!last || date > last) last = date;
    }
  }
  if (!last) return [];
  const latest = { label: "Latest source month", ...monthRanges(last, 1) };
  const quarter = { label: "Last 3 source months", ...monthRanges(last, 3) };
  return first.slice(0, 7) <= quarter.dateRange.start.slice(0, 7)
    ? [latest, quarter]
    : [latest];
}

const samePeriod = (a: DateRange, b: DateRange) =>
  a.start === b.start && a.end === b.end;

function toggleValue(selections: Selections, field: string, value: string) {
  const existing = filterValues(selections[field]);
  const next = { ...selections };
  const values = existing.includes(value)
    ? existing.filter((item) => item !== value)
    : [...existing, value];
  if (values.length) next[field] = values;
  else delete next[field];
  return next;
}

function Chips({
  filters,
  onRemove,
}: {
  filters: Selections;
  onRemove: (field: string, value: string) => void;
}) {
  return activeFilters(filters).flatMap(({ field, values }) =>
    values.map((value) => (
      <button
        className="filter-chip"
        key={JSON.stringify([field, value])}
        onClick={() => onRemove(field, value)}
        aria-label={`Remove ${filterLabel(field)}: ${value}`}
      >
        <span>
          {filterLabel(field)}: {value}
        </span>
        <Icon name="close" size={14} />
      </button>
    )),
  );
}

type View = Pick<Dashboard, "dateRange" | "comparisonPeriod" | "filters">;

function FilterEditor({
  dashboard,
  presets,
  options,
  onApply,
  onClose,
}: {
  dashboard: Dashboard;
  presets: ReturnType<typeof availablePeriods>;
  options: ReturnType<typeof filterOptions>;
  onApply: (view: View) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>({
    dateRange: dashboard.dateRange,
    comparisonPeriod: dashboard.comparisonPeriod,
    filters: dashboard.filters,
  });
  const [field, setField] = useState(options[0]?.field ?? "");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [custom, setCustom] = useState(false);
  const current = options.find((option) => option.field === field);
  const values =
    current?.values.filter((value) =>
      value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    ) ?? [];
  const matchedPreset = presets.find(
    (preset) =>
      samePeriod(view.dateRange, preset.dateRange) &&
      samePeriod(view.comparisonPeriod, preset.comparisonPeriod),
  );
  const updatePeriods = (
    periods: Pick<View, "dateRange" | "comparisonPeriod">,
  ) => {
    setView({
      ...view,
      dateRange: periods.dateRange,
      comparisonPeriod: periods.comparisonPeriod,
    });
    setError("");
  };
  const changeChoice = (key: string, value: string) =>
    setView({ ...view, filters: toggleValue(view.filters, key, value) });

  function apply() {
    if (![view.dateRange, view.comparisonPeriod].every(validRange)) {
      setCustom(true);
      setError("Enter a start and end date in order for both periods.");
      return;
    }
    if (
      view.dateRange.start <= view.comparisonPeriod.end &&
      view.comparisonPeriod.start <= view.dateRange.end
    ) {
      setCustom(true);
      setError(
        "The reporting and comparison periods overlap. Change one period and try again.",
      );
      return;
    }
    onApply(view);
  }

  return (
    <Sheet
      title="Dates and filters"
      onClose={onClose}
      footer={
        <button className="primary" onClick={apply}>
          Apply to dashboard <Icon name="arrow" />
        </button>
      }
    >
      <div className="stack filter-editor">
        <section aria-labelledby="period-filter-title" className="stack">
          <h3 id="period-filter-title">Date range</h3>
          {presets.length > 0 && (
            <div className="actions">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className="secondary filter-option"
                  aria-pressed={matchedPreset === preset}
                  onClick={() => updatePeriods(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <div className="filter-period-summary">
            <p>
              Reporting <strong>{showPeriod(view.dateRange)}</strong>
            </p>
            <p>
              Comparison <strong>{showPeriod(view.comparisonPeriod)}</strong>
            </p>
          </div>
          <p className="subtitle">
            Targets stay as set. Review them if you change the length of the
            reporting period.
          </p>
          <button
            className="text-button disclosure-button"
            aria-expanded={custom}
            aria-controls="custom-periods"
            onClick={() => setCustom(!custom)}
          >
            Custom reporting and comparison dates{" "}
            <Icon name="chevron" size={15} />
          </button>
          <div id="custom-periods" hidden={!custom}>
            {(["dateRange", "comparisonPeriod"] as const).map((key) => (
              <fieldset className="date-filter-fields" key={key}>
                <legend>
                  {key === "dateRange"
                    ? "Reporting period"
                    : "Comparison period"}
                </legend>
                <div className="two-fields">
                  {(["start", "end"] as const).map((bound) => (
                    <label className="field" key={bound}>
                      {key === "dateRange" ? "Reporting" : "Comparison"} {bound}
                      <input
                        type="date"
                        required
                        value={view[key][bound]}
                        aria-invalid={!!error}
                        aria-describedby={
                          error ? "period-filter-error" : undefined
                        }
                        onInput={(event) =>
                          updatePeriods({
                            ...view,
                            [key]: {
                              ...view[key],
                              [bound]: event.currentTarget.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {error && (
            <p className="error" role="alert" id="period-filter-error">
              {error}
            </p>
          )}
        </section>
        <section
          className="stack filter-dimensions"
          aria-labelledby="source-filter-title"
        >
          <h3 id="source-filter-title">Source fields</h3>
          {current ? (
            <>
              <label className="field">
                Filter by field
                <select
                  value={field}
                  onChange={(event) => {
                    setField(event.target.value);
                    setSearch("");
                  }}
                >
                  {options.map((option) => (
                    <option key={option.field} value={option.field}>
                      {filterLabel(option.field)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="subtitle">
                Choose any values to include. Results must match each selected
                field.
              </p>
              {current.values.length > 8 && (
                <label className="field">
                  Search {filterLabel(field)} values{" "}
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              )}
              <fieldset className="filter-values">
                <legend>{filterLabel(field)} values</legend>
                {values.length ? (
                  values.slice(0, 80).map((value) => (
                    <label className="checkbox" key={value}>
                      <input
                        type="checkbox"
                        checked={filterValues(view.filters[field]).includes(
                          value,
                        )}
                        onChange={() => changeChoice(field, value)}
                      />{" "}
                      <span>{value}</span>
                    </label>
                  ))
                ) : (
                  <p role="status">
                    No values match your search. Try another word.
                  </p>
                )}
              </fieldset>
              {values.length > 80 && (
                <p role="status">
                  Showing 80 of {values.length} values. Refine your search to
                  see another value.
                </p>
              )}
            </>
          ) : (
            <p className="subtitle">
              This data has no category fields. Upload a fictional file with
              fields such as Location, Channel, or Status to filter by them.
            </p>
          )}
          {activeFilters(view.filters).length > 0 && (
            <div className="actions" aria-label="Selected filter values">
              <Chips filters={view.filters} onRemove={changeChoice} />
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}

export function DashboardFilters({
  dashboard,
  sourceLabel,
  onUpdate,
}: {
  dashboard: Dashboard;
  sourceLabel: string;
  onUpdate: (dashboard: Dashboard) => void;
}) {
  const [open, setOpen] = useState(false);
  const [before, setBefore] = useState<Dashboard["kpiResults"]>();
  const opener = useRef<HTMLButtonElement>(null);
  const options = useMemo(
    () => filterOptions(dashboard.sources, dashboard.mappings),
    [dashboard.sources, dashboard.mappings],
  );
  const presets = useMemo(
    () => availablePeriods(dashboard),
    [dashboard.sources, dashboard.mappings],
  );
  const selected = activeFilters(dashboard.filters);
  const resetDates =
    presets[0] &&
    (!samePeriod(dashboard.dateRange, presets[0].dateRange) ||
      !samePeriod(dashboard.comparisonPeriod, presets[0].comparisonPeriod));
  const dateChipLabel =
    presets.find(
      (preset) =>
        samePeriod(dashboard.dateRange, preset.dateRange) &&
        samePeriod(dashboard.comparisonPeriod, preset.comparisonPeriod),
    )?.label ?? "Custom dates";
  const results = dashboard.kpiResults.filter(
    (result) => result.value !== undefined,
  ).length;
  const previous = new Map(before?.map((result) => [result.kpiId, result]));
  const changed = dashboard.kpiResults.filter((result) => {
    const old = previous.get(result.kpiId);
    return (
      old &&
      (result.value !== old.value ||
        result.previousValue !== old.previousValue ||
        result.status !== old.status)
    );
  });
  const changeView = (view: Partial<View>) => {
    setBefore(dashboard.kpiResults);
    onUpdate({ ...dashboard, ...view });
    if (!open) opener.current?.focus();
  };
  const defaultDates = presets[0]
    ? {
        dateRange: presets[0].dateRange,
        comparisonPeriod: presets[0].comparisonPeriod,
      }
    : {};

  return (
    <section
      className="panel context-card"
      aria-label="Dashboard view settings"
    >
      <div className="view-bar">
        <div className="view-date">
          <span>Reporting period</span>
          <strong>{showPeriod(dashboard.dateRange)}</strong>
        </div>
        <div className="view-date">
          <span>Compared with</span>
          <strong>{showPeriod(dashboard.comparisonPeriod)}</strong>
        </div>
        <div className="view-date">
          <span>Data source</span>
          <strong>{sourceLabel}</strong>
        </div>
        <button
          className="secondary"
          ref={opener}
          onClick={() => setOpen(true)}
        >
          <Icon name="filter" /> Dates and filters
        </button>
      </div>
      <div className="view-summary">
        <p role="status">
          {results} of {dashboard.kpiResults.length} KPIs available
          {selected.length
            ? ` · ${selected.length} ${selected.length === 1 ? "field" : "fields"} filtered`
            : ""}
        </p>
        {(selected.length > 0 || resetDates) && (
          <div className="actions" aria-label="Active filters">
            {resetDates && (
              <button
                className="filter-chip"
                aria-label={`Remove date filter: ${dateChipLabel}`}
                onClick={() => changeView(defaultDates)}
              >
                {dateChipLabel} <Icon name="close" size={14} />
              </button>
            )}
            <Chips
              filters={dashboard.filters}
              onRemove={(field, value) =>
                changeView({
                  filters: toggleValue(dashboard.filters, field, value),
                })
              }
            />
            <button
              className="text-button"
              onClick={() => changeView({ ...defaultDates, filters: {} })}
            >
              Reset view
            </button>
          </div>
        )}
      </div>
      {before && (
        <p className="view-changes" role="status">
          {changed.length
            ? `Changed KPIs: ${changed.map((result) => result.name).join(", ")}`
            : "KPI values and statuses stayed the same."}
        </p>
      )}
      {open && (
        <FilterEditor
          dashboard={dashboard}
          presets={presets}
          options={options}
          onApply={(view) => {
            changeView(view);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
