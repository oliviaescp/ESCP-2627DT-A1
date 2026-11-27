# Technical Architecture

## Architecture decision summary

**Product:** dAIshi, an evidence-based decision and KPI dashboard creator  
**Architecture base:** Option A, local-first front-end prototype  
**Target devices:** Phone, tablet, and desktop\
**Prototype status:** Functional demonstration, not a production system

The prototype will run entirely in the browser. It will not require a backend, database server, account system, authentication, external AI service, live integration, email service, or production privacy infrastructure.

The goal is to make the smallest implementation that demonstrates the complete product idea:

1. choose a business context and goal;
2. select KPIs and assumptions;
3. upload a small CSV or Excel file from the phone;
4. inspect and confirm the suggested field mappings;
5. calculate KPI results locally;
6. show a mobile dashboard with transparent warnings;
7. edit, save, reopen, and delete the dashboard locally.

The architecture keeps business calculations and domain rules separate from the user interface so that the prototype can later be expanded into a real application. It deliberately avoids building production infrastructure before the product concept has been validated.

## Reasoning behind the choices

### Why local-first

The assignment limits the prototype to fictional data. A local-first browser application supports the demo with local files, rules, and storage.

It has four practical advantages:

- it can be started with one command;
- it works without a server or account setup;
- uploaded files remain in the user’s browser instead of being sent to a service;
- the complete product flow can be demonstrated with sample data.

The trade-off is intentional: dashboards are available only in the same browser on the same device. The prototype must clearly communicate this limitation.

### Why phone first

The dashboard puts the decision, time period, and key measures first at narrow widths. Desktop and tablet retain that reading order while using more space for metrics and supporting evidence. The business rules and browser storage are shared across layouts.

### Why localStorage instead of a browser database

The prototype uses `localStorage` because it is sufficient for small fictional datasets and requires no additional persistence library. Parsed file rows and dashboard state are serialized into a small local workspace.

This creates a deliberate prototype boundary:

- file size is limited;
- only small datasets are supported;
- raw files are not preserved as downloadable originals;
- users can delete local data from Settings;
- production should replace this with a server database and object storage.

If the prototype later needs larger files, the first upgrade should be IndexedDB rather than a backend. That upgrade is outside the current draft.

### Why deterministic local AI behavior

The product must not invent KPI values, hide missing data, or present an unsupported conclusion as fact. The prototype therefore simulates AI behavior with deterministic functions and templates:

- context rules recommend KPIs;
- field-name aliases suggest mappings;
- explicit formulas calculate KPI values;
- threshold rules generate warnings;
- templates produce plain-language explanations.

The prototype uses pure rules and templates in the domain and feature layers. The browser runs the full calculation and explanation flow.

## Technology stack

The prototype uses the stack below. The lockfile records the versions installed by `npm ci`.

### Runtime and application

- **Language:** TypeScript
- **UI framework:** React
- **Build tool:** Vite
- **Routing:** React Router
- **Package manager:** npm
- **Runtime:** Node.js LTS
- **Module format:** ES modules

### Styling and visual interface

- **CSS framework:** Tailwind CSS
- **Component approach:** small local component library inside the project
- **Icons:** inline SVG icons
- **Charts:** Recharts for one or two simple trend visualizations
- **Fonts:** system sans-serif stack; no external font dependency is required

The interface should use a small token set for spacing, typography, surfaces, borders, and statuses. Avoid introducing a large UI framework because the prototype only requires a limited number of mobile components.

### Data processing and validation

- **CSV parsing:** Papa Parse
- **Excel parsing:** `read-excel-file` for XLSX
- **Schema validation:** Zod
- **State management:** React Context plus `useReducer`
- **Persistence:** browser `localStorage`
- **Calculations:** TypeScript domain functions

No server-side runtime is required for the prototype.

### Development and static hosting

- **Component catalogue:** Storybook for React and Vite, with the shared application stylesheet and fictional data
- **Verification:** Vitest for domain and infrastructure, Playwright and axe for browser checks
- **Deployment:** GitHub Actions publishes the static Vite app and Storybook to GitHub Pages

## Application structure

```text
.storybook/         Storybook configuration and shared preview theme
src/
├── app/           Routes, workspace state, error handling, and dashboard workflow
├── components/    Shared UI primitives and component stories
├── features/      Creation, dashboard, and workspace management screens
├── domain/        KPI definitions, calculations, mapping, warnings, and sample data
├── infrastructure/  Local file parsing, validation, and persistence
├── styles.css     Design tokens and responsive layouts
└── main.tsx       Browser entry point
tests/             Playwright journeys and fictional upload fixtures
```

### Layer responsibilities

#### `app`

Bootstraps React, defines routes, registers providers, and handles application-level errors. It should not contain KPI formulas or file parsing logic.

#### `components`

Contains reusable phone UI components. Components should be presentational and receive data and callbacks through props. They should not directly read from localStorage.

#### `features`

Contains screens, feature-specific components, and feature-level hooks. Each feature coordinates user interaction but delegates calculations and persistence to application services.

#### `domain`

Contains business concepts and pure functions. The domain layer must not import React, browser APIs, or charting libraries.

#### `infrastructure`

Contains browser-specific implementations for file reading, parsing, validation, and localStorage.

## Application shell

The app should use a single-column mobile shell:

```text
┌──────────────────────────┐
│ Header                   │
│ Page title     Action    │
├──────────────────────────┤
│                          │
│ Page content             │
│                          │
│                          │
├──────────────────────────┤
│ Home  Data  Alerts  More │
└──────────────────────────┘
```

### Mobile layout rules

- Support phone widths down to 320 CSS pixels.
- Use a single content column.
- Use one or two KPI columns as space permits.
- Use horizontal scrolling only for short filters or compact tab groups.
- Keep bottom navigation fixed to the bottom of the viewport.
- Keep primary actions reachable with one hand where practical.
- Avoid hover-only behavior.
- Use large touch targets, preferably at least 44px high.
- Use a sticky header only when it improves navigation.

At wider widths, move navigation into the header and give KPI cards, charts, and warning lists more horizontal space.

### Primary routes

```text
/
/onboarding/context
/onboarding/kpis
/onboarding/upload
/onboarding/mapping
/onboarding/generating
/dashboards/:dashboardId
/dashboards/:dashboardId/edit
/sources
/alerts
/settings
```

The creation flow should redirect to the next step after a successful action. Users must be able to return to previous steps without losing confirmed state.

## State management

Use one application-level `WorkspaceContext` with a reducer. This avoids adding a separate state library while keeping state transitions explicit.

### Workspace state

```ts
type WorkspaceState = {
  context: UserContext | null;
  assumptions: Assumption[];
  selectedKpiIds: string[];
  customKpis: KpiDefinition[];
  sources: DataSource[];
  mappings: DataMapping[];
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  generation: GenerationState;
  lastSavedAt: string | null;
};
```

### Reducer actions

```text
SET_CONTEXT
ADD_ASSUMPTION
SELECT_KPI
REMOVE_KPI
REORDER_KPIS
ADD_CUSTOM_KPI
ADD_SOURCE
REMOVE_SOURCE
UPDATE_SOURCE_STATUS
SET_MAPPING
CONFIRM_MAPPING
SET_GENERATION_STATUS
CREATE_DASHBOARD
UPDATE_DASHBOARD
DELETE_DASHBOARD
SET_ACTIVE_DASHBOARD
RESET_WORKSPACE
```

### Persistence behavior

The provider should load the workspace from localStorage during startup and save changes after relevant reducer actions. Persistence should be debounced to avoid writing on every keystroke.

Use a versioned storage envelope:

```ts
type StorageEnvelope = {
  version: 1;
  savedAt: string;
  workspace: WorkspaceState;
};
```

If the stored version is unsupported or corrupted, the app starts with an empty recovery workspace and pauses saves. The stored copy stays available until the user clears it in Settings.

## Domain model

The prototype should model the product concepts as TypeScript types. These types are product-level structures, not a production database schema.

```ts
type UserContext = {
  industry: string;
  sector: string;
  position: string;
  companyOrProject?: string;
  goal: string;
  scenario: 'restaurant' | 'consulting';
};

type Assumption = {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  createdAt: string;
  period?: DateRange;
};

type KpiDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'team' | 'project';
  requiredInputs: string[];
  formulaKey: string;
  unit: 'number' | 'currency' | 'percentage' | 'hours';
  direction: 'higher-is-better' | 'lower-is-better' | 'target-range';
  target?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  period: 'day' | 'week' | 'month';
};

type DataSource = {
  id: string;
  name: string;
  type: 'csv' | 'xlsx' | 'sample';
  isSample: boolean;
  rowCount: number;
  fieldNames: string[];
  period?: DateRange;
  uploadedAt: string;
  freshness: 'current' | 'outdated' | 'unknown';
  status: 'valid' | 'needs-review' | 'invalid';
  rows: Record<string, unknown>[];
};

type DataMapping = {
  id: string;
  sourceId: string;
  sourceField: string;
  kpiId: string;
  inputName: string;
  confidence: number;
  status: 'suggested' | 'confirmed' | 'unresolved';
};

type KpiResult = {
  id: string;
  kpiId: string;
  value?: number;
  target?: number;
  variance?: number;
  variancePercent?: number;
  trend?: 'up' | 'down' | 'stable' | 'unknown';
  status: 'on-track' | 'watch' | 'critical' | 'unavailable';
  period: DateRange;
  comparisonPeriod?: DateRange;
  sourceReferences: SourceReference[];
  qualityNotes: string[];
};

type Warning = {
  id: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  explanation: string;
  changedValues: string[];
  impact?: string;
  ruleKey: string;
  sourceReferences: SourceReference[];
  caveats: string[];
  possibleNextStep?: string;
};

type Dashboard = {
  id: string;
  name: string;
  context: UserContext;
  kpiResults: KpiResult[];
  warnings: Warning[];
  dateRange: DateRange;
  comparisonPeriod?: DateRange;
  filters: Record<string, string | string[]>;
  selectedKpiIds: string[];
  createdAt: string;
  updatedAt: string;
  dataFreshness: string;
};
```

## File processing pipeline

The file workflow should be entirely local:

```text
Phone file picker
  → File type and size check
  → CSV or Excel parser
  → Normalized rows
  → Field detection
  → Data quality checks
  → Mapping suggestions
  → User confirmation
  → KPI calculation
  → Warning generation
  → Dashboard creation
```

### File constraints

To keep the prototype simple, use these limits:

- maximum file size: 2 MB;
- maximum parsed rows per file: 5,000;
- maximum uploaded files per dashboard: 5;
- supported formats: `.csv` and `.xlsx`;
- legacy `.xls` is not required;
- files with unsupported formats are rejected before parsing.

The limits should be visible on the upload screen. If a file exceeds a limit, the app should explain the problem and suggest using a smaller sample file.

### Normalized row format

All parsers should return the same internal representation:

```ts
type ParsedFile = {
  name: string;
  type: 'csv' | 'xlsx';
  sheets?: string[];
  selectedSheet?: string;
  fields: string[];
  rows: Record<string, unknown>[];
  warnings: string[];
};
```

Values should be normalized conservatively:

- preserve original text values;
- parse numeric values only when unambiguous;
- recognize common date formats;
- retain invalid values for display in data-quality notes;
- never silently replace missing data with zero.

## KPI calculation engine

KPI calculations must be pure functions. The same normalized rows, mapping, KPI definition, and period must always produce the same result.

### Example fixed formulas

```text
Revenue growth
  (current revenue - previous revenue) / previous revenue

Food cost ratio
  food cost / revenue

Project completion rate
  completed projects / total projects

Team utilization
  billable hours / available hours

Repeat customer rate
  repeat customers / total customers
```

The calculation result must include source references and quality notes. If a required input is missing, the result status must be `unavailable` rather than a guessed value.

### Calculation sequence

1. Find the selected KPI definition.
2. Find confirmed mappings for every required input.
3. Filter rows by the selected date range.
4. Validate required values.
5. Calculate the KPI using its formula key.
6. Calculate target variance where a target exists.
7. Calculate comparison-period variance where data exists.
8. Assign a status using the KPI direction and thresholds.
9. Add source references and quality notes.

## Mapping suggestion engine

Mapping suggestions should use simple, explainable rules:

1. normalize field names to lowercase;
2. remove punctuation and common stop words;
3. compare exact aliases;
4. compare partial aliases;
5. compare compatible data types;
6. assign a confidence score;
7. show the suggestion to the user for confirmation.

Example aliases:

```text
revenue:
  revenue, sales, turnover, total sales, gross sales

food_cost:
  food cost, ingredient cost, cost of goods, cogs

customers:
  customers, guests, clients, customer count

repeat_customers:
  repeat customers, returning customers, returning guests
```

No mapping with low confidence should be silently confirmed. Unresolved mappings must remain visible.

## Warning generation

Warnings are generated from explicit rules. The first version should implement only a small number of rules:

```text
Target deviation:
  actual value is outside the KPI warning threshold

Critical deviation:
  actual value is outside the critical threshold

Stale source:
  source data is older than the configured freshness period

Missing input:
  a required KPI input cannot be mapped

Conflicting source:
  two sources provide materially different values for the same period
```

Warning priority should be determined by rule severity and the size of the deviation. Every warning should include:

- a short title;
- the changed values;
- the comparison period;
- the source reference;
- the triggering rule;
- an impact statement when calculable;
- a caveat when data quality is uncertain;
- a possible next step written as a suggestion.

## Local rules and explanations

- [KPI definitions](src/domain/kpiDefinitions.ts) supply scenario recommendations and supported inputs.
- [Mapping rules](src/domain/mappingRules.ts) rank alias matches for the user to confirm.
- [Warning rules](src/domain/warningRules.ts) explain deviations using calculated values and source evidence.
- The [AI summary](src/features/BusinessSummary.tsx) describes the current filtered results and links to the evidence or warning. It runs in the browser with deterministic templates and requires no API key.

## Sample scenarios

The prototype should include two small sample datasets.

### Restaurant scenario

Primary demonstration scenario:

- revenue by month;
- food costs by month;
- customer count;
- repeat customer count;
- delivery revenue;
- employee satisfaction;
- target values and a menu-relaunch assumption.

The central demonstration warning can compare a planned revenue increase with actual revenue and repeat-customer performance.

### Consulting scenario

Secondary demonstration scenario:

- project name;
- project status;
- project revenue;
- completion percentage;
- billable hours;
- team capacity;
- client satisfaction;
- overdue tasks.

The sample data must be fictional and clearly labeled in the UI.

## Screen and route responsibilities

### Onboarding and context

Overview opens the practice guide, fictional samples, or saved dashboards. Setup uses the selected scenario and goal, with optional advanced context. Store the draft in `WorkspaceContext`.

### KPI selection

Display recommended KPI definitions. Allow selection, removal, ordering, and basic target entry. Custom KPIs may be added as metadata but do not need a formula builder.

### Upload

Use the phone’s file picker. Do not require drag-and-drop. Show format limits, sample file buttons, privacy guidance, and upload status.

### Mapping and validation

Show source fields, suggested mappings, confidence, KPI coverage, missing inputs, and data-quality warnings. Require confirmation before generation.

### Generation

Show a status while the browser calculates results from confirmed inputs. Keep the draft and offer a return to mapping if calculation is interrupted.

### Dashboard

Use a vertical mobile layout:

1. Dashboard header and AI summary.
2. Dates, comparison, and active source filters.
3. KPI cards with evidence actions.
4. Trend and warnings with drill-down.
5. Source freshness and unresolved-data notes.

### Alerts

List warnings ordered by priority. Open a warning detail view with the evidence, calculation, source, and caveats.

### Settings

Show prototype limitations, sample-data status, local data controls, and delete actions. Include a “Clear local workspace” action with confirmation.

## Styling and accessibility

The design should be calm, professional, and readable on a small screen.

### Visual tokens

Use a limited palette:

- background: light neutral;
- surface: white;
- text: dark neutral;
- border: light gray;
- primary action: one accent color;
- status success: green plus text label;
- status warning: amber plus text label;
- status critical: red plus text label;
- status unresolved: gray or blue plus text label.

Status colors must always be paired with text such as “On track,” “Needs review,” or “Critical.”

### Accessibility requirements

- all form controls need visible labels;
- all buttons need accessible names;
- touch targets should be at least 44px high;
- keyboard focus must be visible;
- text contrast must be readable;
- charts must have a text summary or adjacent table;
- validation errors must be announced near the relevant field;
- no action may depend only on color;
- dialogs must trap focus and close predictably.

## Error and recovery behavior

The prototype must handle:

- unsupported file type;
- file larger than the allowed limit;
- empty file;
- corrupted workbook;
- missing fields;
- invalid numbers or dates;
- unresolved mappings;
- unavailable KPI result;
- conflicting sources;
- failed generation;
- cleared or corrupted localStorage;
- no available data for a selected period.

Every error should include:

1. what happened;
2. what the user can do next;
3. whether existing saved work is safe.

The app should never display a blank screen because a file or local workspace is invalid. Use an application error boundary for unexpected failures.

## Security and privacy boundaries

This prototype is not a production secure data system.

It must:

- use fictional sample data;
- warn users not to upload confidential business data;
- keep file parsing in the browser;
- avoid external AI calls;
- provide local delete controls;
- clearly label local uploads and sample data;
- avoid placing secrets in frontend source code;
- avoid claiming GDPR compliance, secure multi-user storage, or production retention controls.

The production version would require authentication, authorization, encrypted storage, server-side validation, object storage, audit logs, retention policies, deletion workflows, consent controls, and explicit policies for external AI processing.

## Local development and run instructions

### Prerequisites

- Node.js 22.12+ with Node 24 LTS recommended;
- npm;
- a modern browser;
- a phone or browser device emulator for testing the target layout.

### Create and run

```bash
npm ci
npm run dev
```

Open the local development URL in a phone browser or use the browser’s phone device emulation.

### Production build

```bash
npm run build
npm run preview
```

### Available checks and component catalogue

```bash
npm run typecheck
npm test
npm run test:e2e
npm run storybook
npm run build-storybook
```

No environment variables are required for the prototype. If a future integration needs configuration, it must be added through documented `VITE_` variables and must never contain private server secrets.

## Testing approach

Use the smallest test set that protects the central product claim.

### Unit tests

Test:

- each fixed KPI formula;
- target variance;
- KPI status assignment;
- warning priority;
- date filtering;
- mapping alias matching;
- missing-data behavior;
- localStorage serialization and recovery.

### Component tests

Test:

- KPI selection;
- file validation states;
- mapping confirmation;
- dashboard empty state;
- warning detail;
- delete confirmation;
- mobile bottom navigation.

### End-to-end test

The main happy-path test should:

1. open onboarding;
2. select the restaurant scenario;
3. select three KPIs;
4. load sample data;
5. confirm mappings;
6. generate the dashboard;
7. open a warning;
8. verify the source explanation;
9. edit and save the dashboard;
10. reopen it;
11. delete it.

### Manual phone checks

Verify the app on a narrow phone viewport for:

- file picker access;
- scrolling;
- fixed bottom navigation;
- keyboard behavior;
- touch target size;
- long warning text;
- charts and tables;
- empty and error states;
- orientation changes where available.

## Implementation phases

### Phase 1: project foundation

- create the Vite React TypeScript project;
- configure Tailwind CSS;
- add mobile shell and routes;
- create base components;
- add sample scenario data;
- establish the workspace reducer.

### Phase 2: onboarding and KPI selection

- implement context form;
- implement scenario selection;
- implement recommended KPI registry;
- implement KPI selection and target entry;
- persist draft workspace state.

### Phase 3: upload and validation

- add CSV parsing;
- add XLSX parsing;
- normalize rows;
- validate file size and structure;
- display source metadata;
- implement field detection.

### Phase 4: mapping and calculations

- implement alias-based mapping suggestions;
- implement mapping confirmation;
- implement fixed KPI formulas;
- implement source references;
- implement missing-data states.

### Phase 5: dashboard and warnings

- implement generation progress;
- generate KPI cards;
- generate trends and tables;
- implement warning rules;
- implement warning detail screen;
- implement dashboard editing.

### Phase 6: persistence and polish

- save and reopen dashboards;
- add delete controls;
- add Settings and privacy information;
- add error recovery;
- add accessibility checks;
- test phone layouts;
- build and preview the static site.

## Definition of done

The architecture and implementation are sufficient for the draft when:

- the app runs locally with `npm ci` and `npm run dev`;
- the experience is usable in a phone-sized viewport;
- no backend or account is required;
- a user can complete the full guided flow with sample data;
- a user can upload a small local CSV or XLSX file;
- the app detects fields and suggests mappings;
- the user must confirm mappings before calculation;
- at least three KPI types calculate from sample data;
- KPI results show target, variance, trend, status, period, and source;
- at least one warning explains a changed assumption or threshold deviation;
- unresolved data is never shown as a confident result;
- the user can edit, save, reopen, and delete a dashboard;
- local data can be cleared from Settings;
- the product explains that it is a prototype and should not receive confidential data;
- the app does not claim production security, GDPR compliance, live integrations, or autonomous decision-making.

## Future production architecture

The production system should not be built until the local-first prototype validates the main workflow. If validated, the likely next architecture would be a TypeScript modular monolith:

```text
React mobile/web client
  → TypeScript API
  → PostgreSQL relational database
  → Object storage for uploaded files
  → Background processing for parsing and calculations
  → Authentication and authorization
  → Audit logging and retention controls
  → Optional external AI adapter with explicit consent
```

The production version would introduce:

- account and organization models;
- role-based access control;
- server-side file validation;
- encrypted file storage;
- background processing for large files;
- versioned KPI definitions;
- audit history for assumptions and mappings;
- source-document permissions;
- retention and deletion policies;
- integration connectors;
- reliable observability and error reporting;
- tested AI safeguards.

These capabilities are intentionally excluded from the current prototype.
