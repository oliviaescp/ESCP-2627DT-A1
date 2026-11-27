# dAIshi

A functional, phone-first prototype for evidence-based business dashboards. Choose a restaurant or consulting context, record an assumption, select KPIs and targets, load fictional data or local CSV/XLSX files, confirm mappings, and generate an editable dashboard with traceable results.

[Live prototype](https://oliviaescp.github.io/ESCP-2627DT-A1/) · [Live Storybook](https://oliviaescp.github.io/ESCP-2627DT-A1/storybook/)

## Assignment deliverables

| Deliverable | File |
| --- | --- |
| User research findings and interview summaries | [evidence.md](evidence.md) |
| Product requirements covering strategy, scope, structure, and skeleton | [product.md](product.md) |
| Design system and component stories | [design.md](design.md) |
| Technology stack and architecture | [architecture.md](architecture.md) |
| Functional web prototype | [Source](src/) and the run instructions below |

The team used agentic coding to implement the prototype from these briefs and to apply the submission feedback.

## Run locally

Requires Node.js 22.12+ (Node 24 LTS recommended) and npm. No environment variables, API keys, backend, or account setup.

```sh
npm ci
npm run dev
```

Vite prints the development URL. The workspace adapts from 320-pixel phone screens to tablet and desktop layouts. For a static production build:

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host. Relative asset paths and hash-based navigation support repository subpaths and refreshing dashboard links without server rewrite rules. There is no service worker or offline installation; an already loaded app calculates locally, but loading/reloading requires the static app to be available.

## GitHub Pages

GitHub Pages is optional for review. The [Pages workflow](.github/workflows/pages.yml) publishes the prototype and Storybook on pushes to `main`.

1. A repository administrator can set the source to **GitHub Actions** under **Settings → Pages → Build and deployment** if moving the project to a new repository.
2. Open **Actions → Deploy dAIshi to GitHub Pages → Run workflow** if the latest automatic run did not deploy.
3. When both jobs are green, open the live links at the top of this README.

## Run Storybook

After `npm ci`, run `npm run storybook` and open `http://localhost:6006`. Browse the status badge, bottom sheet, and dashboard stories. Use the **Light / Dark** toolbar control to inspect both themes. Run `npm run build-storybook` for a static catalogue in `storybook-static/`.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run build-storybook
npm run test:e2e
```

Browser tests use system Chromium at `/usr/bin/chromium` when available. On another machine, install the Playwright browser with `npx playwright install chromium`; the suite uses it automatically. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only to override the executable. The suite starts Vite automatically if port 5173 is free. It exercises both sample journeys, uploads, mapping confirmation/correction, evidence, editing, refresh persistence, deletion, themes, dialogs, mobile layouts, and accessibility. Unit tests cover formulas, warnings, mapping, parsing, and persistence failures. These tests do not establish production security or complete accessibility certification.

## Walkthrough

On Overview, choose **Start guide** or **Quick guide** for the seven-step walkthrough. Practice choosing KPIs, matching a source column, filtering a result, and opening its evidence. Pause on Overview or open the finished practice dashboard as a saved copy. **Restaurant sample** and **Consulting sample** open ready-to-review fictional dashboards. Choose **Create your first dashboard** to review the full setup flow below. **Skip intro** takes you directly to Overview during launch.

1. Choose **Create your first dashboard** to set up your own view. Pick a scenario and add a decision or goal. **Advanced context** holds the role, industry, and original assumption.
2. Select the KPIs you want to track. Open **Targets and alerts** for a KPI to edit its target and thresholds or change its position.
3. Load a fictional sample or choose fictional CSV/XLSX files. Review detected columns and file notes.
4. Review the field mappings. Confirm them individually or use **Confirm fields and generate** to approve the selected fields and open the dashboard. A KPI with missing inputs explains why its value is unavailable.
5. Use **Dates and filters** to set reporting and comparison dates or choose values from source fields. Values within a field are combined, and each selected field must match the row. Remove individual chips or use **Reset view** to restore the latest source month and clear field selections.
6. Read the **AI summary** for the key result, its comparison, and flagged items. It uses on-device rules, updates with the current view, and links to supporting evidence. Use **Edit dashboard** to change setup, **Sources** to manage files, and **Settings** to manage the theme and browser workspace.

## Calculation contract

- Currency is EUR. Percentage values and targets use 0–100.
- Revenue is summed over the selected reporting period. The default is the latest month in the source; a target applies to the entire selected period and is not automatically prorated. Source history charts show monthly values separately from the reporting-period cards.
- Revenue growth = `(current revenue − comparison revenue) / comparison revenue × 100`.
- Food cost, repeat customer, delivery share, completion, and utilization are ratios of summed numerator and denominator inputs, multiplied by 100. Ratios are weighted by their underlying totals, not averaged row percentages.
- Team/client satisfaction uses an equal-row arithmetic mean on a 0–10 scale.
- Project revenue and overdue tasks use sums. Project completion uses explicit completed/total counts; no project-status-to-count inference is made.
- Each KPI requires confirmed date and numeric mappings from one file. Separate files may support different KPIs. Automatic cross-file joins are intentionally unsupported; combine related inputs into one period-aligned file.
- Missing/invalid values, zero denominators, invalid dates, duplicate rows, and impossible population ratios result in an unavailable KPI with an explanation. A missing comparison makes the trend unknown. Growth requires a valid nonzero comparison.
- Warning and critical thresholds default to 5% and 10% relative adverse deviation from the target, adjusted for higher/lower-is-better. At a zero target, any adverse deviation is critical. Percentage-point deltas differ from relative warning thresholds. The interface explains this distinction.
- Freshness uses record dates, not the upload time; the threshold is configurable in Settings (default 45 days). Possible conflicting sources are flagged, and only confirmed mappings are calculated—files are not silently added together.
- Custom KPIs store a definition, unit, cadence, target, and thresholds as **metadata only**. There is no formula builder or calculated custom value. Assumptions are retained as decision context; free-text assumptions are not interpreted as executable financial formulas.

## Files and local persistence

- CSV and XLSX only; legacy XLS is rejected.
- Maximum 2 MB per file, 5,000 parsed data rows per file, five sources per dashboard. XLSX archives also have a maximum 20 MB declared expanded size and 1,000 entries; encrypted, multipart, and ZIP64 archives are rejected. These bounds are prototype safeguards, not a production hostile-file sandbox.
- CSV parsing uses Papa Parse; XLSX uses `read-excel-file`, approved as a maintained alternative to the outdated npm SheetJS release. Parsing occurs locally. Only the first worksheet is imported; other sheet names are shown. Export another worksheet to CSV if needed.
- Use unambiguous decimal numbers and ISO dates (`YYYY-MM-DD` or `YYYY-MM`). Ambiguous formatting is preserved and flagged, not guessed or replaced with zero.
- Parsed rows, source metadata, mappings, draft setup, dashboards, and theme are stored under the versioned `daishi.workspace.v1` localStorage key. Original file bytes are not retained.
- Browser storage is small and may be blocked, evicted, or cleared. Quota/write failures leave changes in memory and retain the previous saved workspace. A visible message explains recovery. Keep the tab open until the saved status appears.
- Corrupt or unsupported saved data is left untouched, saving is paused, and the app opens an empty recovery workspace. Settings → Clear local workspace explicitly removes it and enables saving again.
- Replacing a source invalidates its mappings until reviewed. Deleting a source removes its parsed rows from all linked dashboards and invalidates dependent KPI results. Deleting a dashboard removes that saved view; shared sources remain available through other dashboards.

## Visual and product decisions

The [design system](design.md) documents the evidence-first layout, cobalt accent, and responsive KPI cards. Its implemented tokens live in [src/styles.css](src/styles.css).

The user resolved these material conflicts:

- Use a two-column KPI grid on phones, one column on the narrowest screens, and up to four columns at larger widths.
- Use amber Watch, red Needs attention, and green On track, rather than blue medium warnings in the earlier interviews.
- Use fixed formulas, metadata-only custom KPIs, and editable relative shortfall thresholds.
- Use browser-local storage, fictional fixtures, and local CSV/XLSX processing.

## Prototype boundaries

**Use fictional data only.** “AI” suggestions use local aliases, scenario recommendations, threshold rules, and explanation templates. Warnings explain measured deviations and leave decisions to the user.

This is not secure multi-user storage or a production financial system. It has no authentication, backend, live integrations, external AI, notifications, advanced forecasting, cloud sync, or production GDPR/retention infrastructure.
