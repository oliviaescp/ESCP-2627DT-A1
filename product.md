# dAIshi — Product requirements

Converted from **dAIshi Github - Workshop.docx**. The workshop’s prompts and implementation directions are source documentation, not executed instructions.

Related: [Evidence](evidence.md) · [Product](product.md) · [Architecture](architecture.md) · [Design](design.md)

## Source organization note

product.md — The complete Product Requirements Document, structured around:

- Strategy: user needs and product objectives
- Scope: functional specifications and content requirements
- Structure: interaction design and information architecture
- Skeleton: interface and navigation design
- Also include user stories, functional requirements, non-functional requirements, and the screens affected.
## Unresolved points in the workshop

The conversion preserves the source requirements without silently resolving these differences:

- **Live connections:** FR-06 says uploads “must have a live connection link,” while the architecture specifies local browser imports and explicitly excludes live integrations.
- **Accounts and profile:** Some early screen descriptions include account details or profile controls; the architecture explicitly excludes authentication and user accounts.
- **Alerts scope:** The early app brief puts automatic alerts in later versions. The PRD includes in-dashboard warnings and describes an Alerts screen, while FR-25 marks the cross-dashboard Alerts screen as “Should.”
- **Product naming:** The source uses dAIshi, Dash, and dAIsh (in the stakeholder image). Source names are retained where they occur.

## Product Requirements Document

## Product overview

Product: dAIshi, an evidence-based decision and KPI dashboard creatorDocument status: MVP product requirements for a functional prototypePrimary audience: Product, design, and engineering teamsSource: Workshop brief and interview findings supplied with the project

Dash helps business decision-makers record the assumptions behind important decisions, connect those assumptions to business data, and see when actual performance begins to diverge from the plan. A user selects a business context, defines KPIs and targets, uploads Excel or CSV files, confirms the data mapping, and receives an editable dashboard with traceable calculations and prioritized warnings.

The MVP uses fictional or anonymized data, with a consulting company and an independent restaurant as example contexts. It demonstrates the core value without requiring live integrations, real customer data, or complex enterprise administration.

## Strategy

### User problem

Business information is distributed across spreadsheets, exports, invoices, operational tools, documents, and conversations. Decision-makers often have a target or investment assumption in mind but no simple way to record it, compare it with current performance, or discover that it is no longer true.

The resulting problems are:

- important changes are found late, often during month-end reconciliation;
- projections, targets, and actual results are reviewed separately;
- users cannot easily tell which source or calculation produced a KPI or warning;
- building a useful dashboard requires technical knowledge or manual setup;
- generic dashboards show data but do not connect it to the decision the user is trying to make;
- excessive or unexplained alerts reduce trust and create more work.

### Target users

#### Primary user: owner or decision-maker

An owner, manager, executive, investor, or deal lead who makes operational or financial decisions and needs a fast control panel. This person may be comfortable with spreadsheets but is not expected to be a data or BI specialist.

Example: an independent restaurant owner tracking revenue growth, food cost, repeat customers, delivery share, and employee satisfaction before opening a second location.

#### Secondary user: advisor or analyst

An advisor, investment analyst, asset manager, senior executive, or finance partner who reviews several decisions or deals and needs to prioritize attention. This user values comparisons, historical context, sensitivity to changed assumptions, and drill-down to evidence.

### User needs

Users need to:

- state what they are trying to understand, improve, or decide;
- capture the original assumption, target, or forecast behind that decision;
- select recommended KPIs without starting from a blank page;
- upload the data they already have in Excel or CSV format;
- understand what the system found, what it could calculate, and what is missing;
- review and correct the mapping between their columns and the selected KPIs;
- receive a useful first dashboard in under ten minutes;
- see current value, target, deviation, trend, period, source, and calculation context;
- understand why a warning was raised and what evidence supports it;
- edit the dashboard without technical help;
- trust that the tool supports judgment rather than making the decision for them.

### Value proposition

Dash turns a decision assumption and a small set of business files into a transparent, editable monitoring view. It helps users find out sooner when reality is moving away from the plan, while preserving the source data and reasoning needed for a human review.

### Product objectives

The MVP will:

- prove that a user can define a decision context, assumptions, and KPIs;
- accept multiple Excel or CSV files and identify usable fields;
- let the user confirm or correct data mappings before calculation;
- generate an editable dashboard with KPI cards, charts, tables, trends, and status indicators;
- show the source, comparison period, and calculation behind every KPI and warning;
- surface a small number of relevant, prioritized deviations;
- make the first useful dashboard possible in less than ten minutes;
- demonstrate the concept using fictional or anonymized data.

### Success measures

The prototype is successful when a first-time user can:

- complete onboarding and choose a business context in under two minutes;
- choose or create at least three KPIs and define targets or warning thresholds;
- upload one or more supported files and understand the validation result;
- correct a mapping when the system suggests the wrong field;
- generate a first dashboard in under ten minutes;
- identify the current value, target, trend, and source for a selected KPI;
- open a warning and explain what changed, over which period, and why it matters;
- edit and save the dashboard without assistance.

Quality of the prototype should also be judged by calculation accuracy, clarity of source references, relevance of warnings, and whether users feel the product reduces review effort rather than adding work.

### Product principles

- Evidence before explanation: Every value and warning should point to a source and calculation context.
- Human judgment remains central: Dash highlights changes and possible impact; the responsible person decides what to do.
- Useful by default: Recommendations, sample data, and sensible dashboard layouts help the user reach a first result quickly.
- Transparent uncertainty: Missing data, low confidence, conflicting files, and unsupported calculations are visible.
- Relevant attention: Prefer a few meaningful warnings over a stream of low-value notifications.
- Progressive detail: Show the important result first, then let users drill down into evidence.

### MVP non-goals

The MVP will not:

- support every industry or provide a complete KPI library;
- connect to every business system or guarantee real-time synchronization;
- replace professional BI, finance, risk, or investment tools;
- act as an autonomous business advisor or make final investment decisions;
- provide advanced forecasting, full sensitivity analysis, or predictive modeling;
- implement complex enterprise permissions, team collaboration, or approval workflows;
- send email or mobile notifications;
- provide complete GDPR compliance infrastructure for production customer data;
- require real company data for the prototype.

## Scope

### MVP user journey

- Onboard: Select an industry or example context, business area, position, and goal.
- Define: Choose recommended KPIs, add custom KPIs where needed, and set targets or warning thresholds.
- Upload: Add one or more Excel or CSV files.
- Validate: Review detected fields, supported KPIs, missing data, conflicts, and suggested mappings.
- Generate: Confirm the mapping and create the dashboard.
- Review: Scan KPI cards and prioritized warnings, then drill into the supporting data.
- Edit and save: Change date range, filters, cards, chart types, targets, and dashboard name.
- Manage: Review saved dashboards, data sources, alert rules, and privacy settings.

### Functional specifications

#### 1. Onboarding and context selection

The product must collect enough context to personalize recommendations:

- industry or example industry;
- sector or business area;
- user position;
- business goal or decision to monitor;
- optional company or project name.

The onboarding screen must explain the three-step core process: define KPIs, upload information, and generate the dashboard. The user must be able to use fictional sample data from onboarding.

#### 2. KPI and assumption definition

The user can:

- select from recommended KPIs based on the chosen context;
- search or browse KPI categories;
- add a custom KPI name and description;
- define a target value, target direction, unit, and time period;
- define warning and critical thresholds;
- record the original assumption or expected outcome behind a KPI;
- edit or remove a KPI before dashboard generation.

Example KPI categories include financial, operational, market, customer, project, team, and trading measures. Example KPIs include revenue growth, costs, profit, active projects, completion rate, occupancy, client satisfaction, billable hours, utilization, inventory, margin, and overdue tasks.

#### 3. File upload and data sources

The MVP must accept one or more .xlsx, .xls, or .csv files. The upload experience must show:

- file name and file type;
- upload status and validation status;
- row and column counts where available;
- detected sheets or tables where available;
- last-modified or source-period information when present;
- the ability to remove a file before generation.

The MVP should provide clearly labeled fictional sample files for the consulting and restaurant scenarios. The user must be warned not to upload confidential real company data into the prototype.

#### 4. Data mapping and validation

The product must inspect uploaded files and show:

- fields detected in each file;
- the KPI fields that can be calculated;
- fields that are missing or ambiguous;
- suggested connections between columns and KPI inputs;
- incompatible number, currency, or date formats;
- duplicate, outdated, or conflicting files when detectable;
- the data period used for each calculation.

The user must be able to accept, change, or leave unresolved each suggested mapping. A KPI that cannot be calculated must be clearly marked and must not silently appear as a fabricated result.

#### 5. Dashboard generation

After the user confirms the data mapping, the product must show progress through these stages:

- reading uploaded information;
- matching fields to KPIs;
- calculating results;
- checking data quality;
- assembling the dashboard.

The generation screen must provide a useful error state if analysis fails and must allow the user to return to mapping or retry. The generated dashboard should include the selected KPIs and only show calculated values that have sufficient supporting data.

#### 6. Dashboard and review experience

The generated dashboard must include:

- dashboard name and business context;
- date range and comparison-period controls;
- KPI cards with current value, target, variance, status, and trend;
- charts or tables appropriate to the selected KPI;
- prioritized warnings or changed-assumption indicators;
- filters such as client, project, deal, location, or product when the uploaded data supports them;
- last updated time;
- source references and a path to calculation details.

The dashboard should place the most important decisions and warnings first. It must support drill-down from a KPI or warning to the relevant source file, field, period, and calculation explanation.

#### 7. Warnings and impact explanations

The MVP includes in-dashboard warnings and an Alerts screen, but not email or mobile delivery. A warning must state:

- what changed;
- the current and comparison values;
- the comparison period;
- the source file or data reference;
- the calculation or rule that triggered it;
- the relevant target or original assumption;
- the estimated operational or financial impact when it can be calculated;
- the warning priority;
- any uncertainty, missing data, or conflicting-source caveat.

Example: “Six weeks after the menu relaunch, revenue is +2% versus the +10% assumption. Repeat rate moved from 47% to 42%. Review the new menu mix and high-price dish demand.” The product must label recommendations as possible next steps, not as guaranteed conclusions.

#### 8. Editing and saved dashboards

Users can:

- rename a dashboard;
- add or remove KPI cards;
- edit targets and warning thresholds;
- change chart type where the data supports it;
- change date range and filters;
- upload an updated file;
- save changes;
- delete a dashboard or uploaded source.

The Saved Dashboards screen must show dashboard name, business context, last updated date, data freshness, and warning count.

#### 9. Settings and privacy

The prototype must make the following visible:

- what data is uploaded and why it is used;
- whether sample or user-provided data is active;
- the data source and last updated time;
- deletion controls for dashboards and files;
- a clear notice that confidential data should not be used in the student prototype;
- a privacy-policy placeholder before real customer data is introduced.

Production requirements for authorization, retention, GDPR processes, and external AI data handling remain future work but should not be contradicted by the prototype experience.

### Content requirements

#### KPI card content

Each KPI card should contain, when available:

- KPI name and plain-language definition;
- current value and unit;
- target or original assumption;
- variance in absolute and percentage terms;
- status such as on track, watch, or critical;
- trend over the selected period;
- comparison period;
- last updated time;
- source reference;
- a link to details.

#### Warning content

Warnings should be concise in the overview and complete in the detail view. They must use plain language, avoid unsupported certainty, and explain the evidence before suggesting a possible next step.

#### Empty, loading, and error content

The product must provide actionable messages for:

- no files uploaded;
- unsupported file format;
- empty or corrupted file;
- missing columns;
- invalid dates or numbers;
- a KPI that cannot be calculated;
- conflicting or outdated sources;
- a very large upload;
- failed AI analysis;
- no internet connection;
- no available dashboard data;
- an interrupted generation process.

Every message should explain what happened, what the user can do next, and whether any previously saved work is safe.

### Data entities at the product level

The experience should treat the following as distinct, traceable objects:

- User context: industry, sector, position, company or project, and goal.
- Decision or assumption: the expected outcome, rationale, date, and relevant period.
- KPI definition: name, description, formula or input fields, unit, target direction, and thresholds.
- Data source: file name, type, period, upload time, status, and freshness.
- Data mapping: source field to KPI input, confidence, and user confirmation state.
- KPI result: calculated value, period, comparison, status, and source references.
- Warning: rule, changed values, priority, impact, explanation, and evidence.
- Dashboard: layout, selected KPIs, filters, date range, name, and update history.

## Structure

### Information architecture

```text
Dash
├── Home / Saved dashboards
│   ├── Dashboard overview
│   └── Dashboard detail
├── Create dashboard
│   ├── 1. Context and goal
│   ├── 2. KPIs and assumptions
│   ├── 3. Upload data
│   ├── 4. Map and validate
│   ├── 5. Generate
│   └── 6. Review dashboard
├── Data sources
├── Alerts
└── Settings and privacy
```

### Interaction model

The create flow is a guided sequence with a visible step indicator. Users can move back to earlier steps without losing confirmed selections. The dashboard is the main working surface after generation; management screens are secondary destinations.

The interaction hierarchy is:

- identify the decision and important KPI;
- show the current result and whether it is on track;
- explain the deviation or warning;
- expose the source and calculation;
- let the user edit the definition, mapping, or view.

### Navigation model

The primary navigation should expose four destinations:

- Dashboards: saved dashboards and the active dashboard;
- Data sources: uploaded files and their validation state;
- Alerts: prioritized warnings across the available dashboards;
- Settings: profile, privacy, deletion, and prototype information.

The “Create dashboard” action should remain prominent from the dashboard home. During creation, the step navigation should be separated from the global navigation so users understand whether they are progressing through setup or browsing saved work.

### Key state transitions

Draft context

→ KPI selection

→ Files uploaded

→ Mapping needs review

→ Ready to generate

→ Generating

→ Dashboard available

→ Dashboard edited and saved

A validation problem moves the user to “Mapping needs review” rather than blocking the entire flow. A KPI with insufficient data remains visible as unresolved and explains what is missing. A failed generation returns the user to a recoverable state with retry and edit options.

### Detail and drill-down pattern

Every KPI card and warning opens a detail view or side panel with:

- summary;
- current and previous values;
- target or assumption;
- date and comparison period;
- source file and field;
- calculation description;
- data-quality notes;
- related KPIs or warnings where available.

This pattern is essential for trust and should be consistent across financial, operational, market, and trading examples.

## Skeleton

### Screen inventory

| Screen | Purpose | Key elements | Primary actions |
| --- | --- | --- | --- |
| Welcome / onboarding | Explain value and setup | Product purpose, three-step explanation, sample-data option | Start, use sample data |
| Context and goal | Personalize the dashboard | Industry, sector, position, goal, company/project | Continue, back |
| KPI selection | Choose monitoring scope | Recommended KPI groups, search, selected KPI list | Select, continue |
| Custom KPI creation | Add a user-specific measure | Name, definition, unit, target, threshold, period | Save KPI, cancel |
| Data upload | Collect source information | Dropzone, file list, formats, sample files, privacy notice | Upload, remove, continue |
| Mapping and validation | Confirm data readiness | Detected fields, KPI coverage, mapping controls, warnings, missing fields | Confirm mapping, fix, back |
| Generation progress | Set expectations during analysis | Progress stages, status messages, cancel/retry behavior | Wait, retry, return to mapping |
| Generated dashboard | Monitor decisions and KPIs | KPI cards, charts, filters, status, warnings, freshness, source links | Inspect, edit, save |
| KPI or warning detail | Explain a result | Current value, target, trend, calculation, source, impact, caveats | Back, edit source or threshold |
| Dashboard editing | Customize the working view | Layout controls, card selection, chart type, filters, thresholds | Save, cancel |
| Saved dashboards | Return to existing work | Dashboard list, warning count, context, last updated | Open, rename, delete, create |
| Data sources | Review uploaded inputs | Source list, file status, period, freshness, delete/re-upload | Inspect, replace, delete |
| Alerts | Prioritize issues across dashboards | Priority, changed assumption, impact, period, source | Open detail, dismiss/archive later |
| Settings and privacy | Manage account and data controls | Profile, privacy notice, delete controls, sample-data label | Save, delete, review policy |

### Interface and layout requirements

#### Global shell

- Persistent product name and current workspace or dashboard name.
- Clear primary navigation on desktop.
- A prominent “Create dashboard” action.
- Breadcrumb or step context during setup.
- Consistent status colors with text labels; color must not be the only indicator.
- Visible loading, error, and unsaved-change states.

#### Dashboard layout

- Header: dashboard name, context, last updated time, date range, comparison period, edit action.
- First content row: the highest-priority KPI cards or changed assumptions.
- Main content: charts and tables chosen for the KPI type.
- Warning area: prioritized alerts with concise explanations and source links.
- Detail access: every card and warning is clickable or has an explicit details action.
- Footer or metadata area: source coverage, data freshness, and unresolved data issues.

#### Upload and mapping layout

- Show the user’s files and the system’s interpretation side by side where practical.
- Use explicit “confirmed,” “needs review,” and “cannot calculate” states.
- Do not hide unresolved mappings behind a generic success message.
- Keep the original file name and field name visible in the review path.

### Responsive and accessibility expectations

The prototype should work at common laptop and tablet widths. On narrow screens, dashboard cards may stack and filters may collapse, but the source and warning explanations must remain accessible.

The interface must use readable text, keyboard-accessible controls, visible focus states, sufficient contrast, labels for form inputs, and text alternatives for status colors and charts. Charts should provide an adjacent table or summary for users who cannot interpret the visualization.

## User stories

### Setup and definition

- As a business owner, I want to select my industry, sector, and position so that the product can recommend relevant KPIs.
- As a decision-maker, I want to record the goal or investment assumption behind my dashboard so that the numbers remain connected to the decision.
- As a manager, I want recommended KPIs so that I can start quickly without knowing dashboard design terminology.
- As an analyst, I want to create a custom KPI with a target and threshold so that the dashboard matches my review process.

### Data and generation

- As a user, I want to upload several Excel or CSV files so that I can work from the information I already have.
- As a user, I want to see which fields were detected and which KPIs can be calculated so that I know whether my files are sufficient.
- As a user, I want to correct suggested data mappings so that the dashboard uses the right columns.
- As a user, I want to understand what the system is doing while the dashboard is generated so that I know whether I should wait or intervene.

### Review and trust

- As a decision-maker, I want to see current value, target, deviation, trend, and comparison period together so that I can assess performance quickly.
- As an advisor, I want a prioritized overview across important warnings so that I can focus on issues that need attention today.
- As a user, I want to open a warning and see its source and calculation so that I can verify it before acting.
- As a user, I want the product to state when data is missing, conflicting, or uncertain so that I do not mistake an incomplete result for a fact.

### Editing and control

- As a user, I want to change date ranges, filters, KPI cards, chart types, and thresholds so that the dashboard fits my review context.
- As a user, I want to save and reopen dashboards so that I can monitor the same decision over time.
- As a user, I want to delete uploaded files and dashboards so that I retain control of my information.
- As a prototype user, I want clear sample-data labeling so that I do not confuse demonstration results with live business data.

## Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | The system shall collect industry, sector, position, and monitoring goal during onboarding. | Must |
| FR-02 | The system shall recommend KPIs based on the selected context. | Must |
| FR-03 | The system shall let users select, remove, and reorder KPIs before generation. | Must |
| FR-04 | The system shall let users create a custom KPI with a definition, unit, target, threshold, and period. | Should |
| FR-05 | The system shall let users record an original assumption or expected outcome. | Must |
| FR-06 | The system shall accept multiple Excel and CSV uploads that must have a live connection link | Must |
| FR-07 | The system shall validate file type, readability, structure, and basic field formats. | Must |
| FR-08 | The system shall show detected fields and KPI coverage for each uploaded source. | Must |
| FR-09 | The system shall suggest mappings between source fields and KPI inputs. | Must |
| FR-10 | The system shall let users accept, edit, or leave mappings unresolved. | Must |
| FR-11 | The system shall prevent unsupported or uncalculated KPIs from appearing as valid results. | Must |
| FR-12 | The system shall show generation progress and recoverable failure states. | Must |
| FR-13 | The system shall generate KPI cards, charts or tables, trends, filters, and status indicators. | Must |
| FR-14 | The system shall show source, period, target, comparison, and calculation context for each KPI. | Must |
| FR-15 | The system shall generate prioritized in-dashboard warnings for meaningful deviations. | Must |
| FR-16 | The system shall explain each warning using changed values, comparison period, source, rule, and impact when available. | Must |
| FR-17 | The system shall support drill-down from KPI cards and warnings to supporting details. | Must |
| FR-18 | The system shall let users edit dashboard name, date range, filters, KPI cards, chart types, targets, and thresholds. | Must |
| FR-19 | The system shall save, reopen, and delete dashboards. | Must |
| FR-20 | The system shall let users inspect, replace, and delete uploaded data sources. | Must |
| FR-21 | The system shall provide empty, loading, validation, and error states for the documented edge cases. | Must |
| FR-22 | The system shall label fictional, anonymized, and user-uploaded data distinctly. | Must |
| FR-23 | The system shall provide privacy guidance and deletion controls before real company data is considered. | Must |
| FR-24 | The system should provide sample consulting and restaurant data for demonstration. | Should |
| FR-25 | The system may provide a cross-dashboard Alerts screen using the same warning objects as the dashboard. | Should |

## Non-functional requirements

| ID | Requirement | Target or expectation |
| --- | --- | --- |
| NFR-01 | Usability | A first-time user can create a basic dashboard in under ten minutes using sample data. |
| NFR-02 | Clarity | Users can identify the current value, target, status, period, and source without technical help. |
| NFR-03 | Accuracy | Calculations must be deterministic for the same input data, KPI definition, and period. |
| NFR-04 | Explainability | Every displayed result and warning must expose its source and calculation context. |
| NFR-05 | Trust | The product must distinguish calculated facts, detected issues, suggestions, and uncertainty. |
| NFR-06 | Performance | Sample-data upload, validation, and dashboard generation should feel responsive, with progress shown for longer work. |
| NFR-07 | Recovery | Refreshing, leaving, or failing during generation must not silently discard confirmed setup or saved dashboards. |
| NFR-08 | Security | The prototype must avoid real confidential data and clearly communicate data-handling limitations. |
| NFR-09 | Privacy | Users must be able to delete uploaded files and dashboards; retention and GDPR work must be defined before production use. |
| NFR-10 | Accessibility | Keyboard navigation, visible focus, readable contrast, labeled controls, and non-color status indicators are required. |
| NFR-11 | Compatibility | The prototype should support current desktop browsers and common laptop and tablet viewport sizes. |
| NFR-12 | Maintainability | KPI definitions, thresholds, sample data, and content should be configurable rather than embedded in individual screens. |
| NFR-13 | Scalability boundary | The MVP may limit file size and row count, but limits must be stated before upload and handled with a clear recovery path. |
| NFR-14 | Human oversight | The product must not present an AI suggestion as a final business, investment, or operational decision. |

## Screens affected

The following screens are in scope for the MVP and are directly affected by these requirements:

- Welcome or onboarding
- Department, sector, position, and goal selection
- KPI selection
- Custom KPI and assumption creation
- Data upload
- Data mapping and validation
- Dashboard-generation progress
- Generated dashboard
- KPI and warning detail
- Dashboard editing
- Saved dashboards
- Data sources
- Alerts
- Settings and privacy

The screens most important to the product proof are KPI selection, data mapping and validation, the generated dashboard, and KPI or warning detail. If implementation time is constrained, these screens should receive the highest fidelity because they demonstrate personalization, source traceability, and the shift from raw data to a decision-ready view.

## Release acceptance checklist

The MVP is ready for prototype review when:

- a user can complete the guided flow from onboarding to a saved dashboard;
- sample consulting and restaurant files can be uploaded successfully;
- at least three KPI types can be calculated from the sample data;
- at least one KPI can be mapped manually after an incorrect suggestion;
- the dashboard shows target, current value, variance, trend, period, and source;
- at least one meaningful warning can be opened and verified against its source data;
- unresolved or invalid data is never represented as a confident result;
- the user can edit and save the dashboard;
- the user can delete a data source and dashboard;
- the interface clearly labels fictional or anonymized data and its prototype limitations;
- the main flow works with keyboard navigation and does not rely on color alone;
- final decisions and recommendations are explicitly left to the responsible human user.

## Earlier workshop app brief

The following is the earlier framing, retained for context alongside the detailed PRD above.

## App Definition Personalized AI Dashboard

This document defines the purpose, scope, user experience, and data requirements for a personalized AI dashboard app. It is based on the product discussion and uses a consulting company as the initial example industry.

### Summary of the Main Sections

1. Purpose and problem

The app helps company employees define the KPIs they want to monitor, upload business information, and automatically receive a personalized, editable AI dashboard. It solves the problem of scattered, difficult-to-understand data and the technical effort required to build dashboards manually.

2. Scope and features

The MVP focuses on three steps: defining KPIs, uploading information, and generating a dashboard with AI. Later versions can include alerts, live integrations, collaboration, and support for more industries. Complex enterprise features are outside the initial scope.

3. User flows and screens

The user selects an area to monitor, chooses KPIs, uploads data, confirms how the data should be used, and generates a dashboard. The app needs screens for onboarding, KPI selection, file upload, data validation, dashboard creation, editing, saved dashboards, alerts, and settings.

4. Data and content

The app stores KPI definitions, uploaded files, data mappings, calculated results, dashboard layouts, and alert settings. The MVP can use fictional Excel or CSV data from a consulting company. Privacy, controlled access, deletion, and GDPR should be considered before using real company data.

### 1. Purpose And Problem

#### One-sentence summary

The app is a personalized AI dashboard creator that helps company employees define the KPIs they care about, upload or connect their business information, and automatically generate an editable dashboard for their department or team.

For the prototype, the example user is someone working in a consulting company who wants to monitor projects, sales, clients, finances, or team performance.

#### The problem it solves

Many companies already have information stored across Excel files, Google Sheets, and internal systems, but the data is difficult to understand and use. Creating a useful dashboard usually requires technical knowledge, manual setup, or a dashboard that was programmed specifically for one department.

Existing tools often provide fixed dashboards or require users to build everything themselves. This app allows users to decide what they want to monitor and then lets AI organize their data into a personalized dashboard.

The main difference is that the dashboard is generated from the user’s goals, chosen KPIs, and uploaded information rather than being a fixed template.

#### Success criteria

The app works if a user can:

Define the KPIs they want to monitor.

Upload their data.

Have the system identify and connect the relevant information.

Receive a useful first dashboard.

Understand the dashboard without technical help.

Edit the dashboard if needed.

For the MVP, a reasonable target is that a user can create a basic dashboard in under 10 minutes. The dashboard should also calculate the selected KPIs accurately and clearly show where the information came from.

### 2. Scope And Features

#### Core features: MVP

The MVP should focus on the following three-step process:

1. Define KPIs

The user chooses what they want to monitor. They can select KPIs such as revenue, active projects, project completion, client satisfaction, team utilization, or overdue tasks. They can also define targets or warning thresholds.

2. Upload information

The user uploads Excel or CSV files. The app accepts multiple files and checks whether the uploaded information contains the data needed for the selected KPIs.

3. Generate the dashboard

AI analyzes the selected KPIs and uploaded data, calculates the KPI values, and creates a dashboard with KPI cards, charts, tables, and trends. The user can then edit the result.

The MVP should use a fictional consulting company and sample data so students can demonstrate the concept without needing access to real company systems.

#### Nice-to-have features for later versions

Automatic alerts when a KPI changes significantly.

Google Sheets or internal-system integrations.

Live data updates.

Department-specific sub-dashboards.

Project folders and reusable dashboards.

AI recommendations about business problems.

Natural-language questions about the data.

Team-meeting or presentation mode.

User accounts and team collaboration.

More industries and pre-built KPI libraries.

Email or mobile notifications.

#### Explicit non-goals for the MVP

The first version should not attempt to:

Support every industry.

Connect to every business system.

Build a fully autonomous AI business advisor.

Provide advanced forecasting.

Handle complex enterprise permissions.

Guarantee real-time synchronization with every data source.

Implement complete GDPR compliance infrastructure.

Build a perfect alert system before the dashboard itself works.

Replace professional business intelligence tools entirely.

The goal is to prove that users can define KPIs, provide data, and receive a personalized dashboard.

### 3. User Flows And Screens

#### Main user journey

1. Onboarding

The user opens the app and selects their company or example industry, their department or business area, and what they want to understand or improve. The app explains that the process has three steps: define KPIs, upload data, and generate the dashboard.

2. Define KPIs

The user sees recommended KPIs based on their selected area. For example, a consulting user may choose revenue, active projects, project completion rate, client satisfaction, billable hours, team utilization, and overdue tasks. The user confirms the KPIs and optionally adds targets or warning thresholds.

3. Upload information

The user uploads one or more Excel or CSV files. The app shows the uploaded file names, the information detected, which KPIs can be calculated, which fields are missing, and suggested connections between data columns and KPIs. The user confirms or corrects the data mapping.

4. Generate dashboard

The user clicks “Create dashboard.” The app shows a short loading process while it reads the data, matches data fields to KPIs, calculates the results, and creates the dashboard. The completed dashboard displays the selected KPIs and visualizations.

5. Edit and review

The user can change the date range, add or remove KPI cards, change chart types, edit targets, rename the dashboard, filter by client or project, and upload updated information.

6. Settings

The user can manage saved dashboards, uploaded data sources, KPI definitions, alert rules, account details, and privacy settings.

#### Main screens

1. Welcome or onboarding screen

2. Department and goal selection

3. KPI selection screen

4. Custom KPI creation screen

5. Data upload screen

6. Data-mapping and validation screen

7. Dashboard-generation progress screen

8. Generated dashboard

9. Dashboard editing screen

10. Saved dashboards screen

11. Data sources screen

12. Alerts screen

13. Settings and privacy screen

#### Edge cases

The app should handle:

No files uploaded.

Unsupported file format.

Empty or corrupted file.

Missing data columns.

Incorrectly formatted numbers or dates.

A KPI that cannot be calculated.

Conflicting information between files.

Very large uploads.

Failed AI analysis.

The user leaving before the dashboard is generated.

No internet connection.

A dashboard with no available data.

The app should explain the problem clearly and suggest what the user can do next.

### 4. Data And Content

#### Data the app stores, creates, or displays

The app may store:

User and company details.

Selected department or business area.

Selected KPI definitions.

KPI targets and warning thresholds.

Uploaded files.

Data mappings.

Calculated KPI values.

Generated dashboard layouts.

Charts, tables, and filters.

Alert rules.

Dashboard update history.

The dashboard may display information such as revenue, costs, profit, projects, clients, employees, tasks, working hours, client feedback, KPI trends, warnings, and status indicators.

#### Where the data comes from

For the MVP, data can come from Excel files, CSV files, and fictional sample data.

In later versions, the app could connect to Google Sheets, company information systems, CRM platforms, project-management tools, finance or HR software, APIs, and live databases.

The user should always be able to see which source was used for each KPI.

#### Privacy, retention, and deletion

Because company data may be confidential, privacy should be considered from the beginning, even if full compliance is implemented later.

The app should:

Clearly explain what data is uploaded and why.

Avoid using real company data in the student prototype.

Use fictional or anonymized data for demonstrations.

Limit access to authorized users.

Allow users to delete uploaded files and dashboards.

Avoid keeping data longer than necessary.

Show when data was last updated.

Avoid sending confidential data to external AI services without permission.

Include a privacy policy before using real customer data.

Follow GDPR requirements if the app is used in the EU.

For the student MVP, the safest approach is to use fictional consulting-company data and clearly label it as demonstration data.

Our product is essentially a dashboard creator for managers/owners of businesses

Part One - Getting input from the user

- The app should collect these information from the user to use it for customization of the
- Industry
- Sector
- Position

## Value Proposition Design

## Customer segment

Investment and business decision-makers managing multiple deals, projects, or business areas with fragmented Excel files and documents.

## Customer jobs

- Compare forecasts and assumptions with actual performance.
- Monitor financial, operational, market, and trading KPIs.
- Detect deviations, inconsistencies, and risks.
- Understand the financial impact of changes.
- Review multiple decisions from one overview.
- Prepare for meetings and make faster, evidence-based decisions.

## Customer pains

- Data is scattered across files, emails, and systems.
- Manual reviews are slow and error-prone.
- It is difficult to identify the latest data or explain what changed.
- Alerts can be irrelevant or unsupported.
- Users fear inaccurate calculations, AI hallucinations, and confidentiality risks.
- New tools may create additional work.

## Customer gains

- One clear overview of important changes.
- Reliable forecast-versus-actual comparisons.
- Prioritized, evidence-based alerts.
- Clear explanation of financial impact.
- Drill-down to source data and calculations.
- Faster decisions with minimal manual effort.

## Products and services

- AI-generated personalized dashboard.
- Assumption and KPI tracking.
- Excel/CSV upload and integration.
- Forecast-versus-actual comparisons.
- Deviation and inconsistency detection.
- Prioritized alerts with source references.
- Impact analysis and drill-down views.

## Value proposition

A trustworthy AI dashboard that connects original assumptions with current data, highlights the most important changes, and explains their financial or operational impact - helping decision-makers act faster without replacing human judgment.

## Recommended MVP

Focus on:

- Uploading Excel or CSV files.
- Capturing assumptions and forecasts.
- Comparing projected and actual results.
- Showing deviation cards.
- Prioritizing important alerts.
- Explaining each alert with its source, calculation, and impact.

The key promise is: see what changed, why it changed, and what it could mean.
