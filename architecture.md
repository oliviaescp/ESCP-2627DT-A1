dAIshi Architecture Prompt
Build dAIshi as a functional, front-end-only prototype of an evidence-based decision and KPI dashboard creator.

The product should help a business owner, manager, advisor, or analyst define a business context, choose the KPIs they care about, provide spreadsheet information, validate how the information is interpreted, and receive an editable dashboard with transparent calculations and prioritized warnings.

This is a prototype co-developed with AI. It should demonstrate the product concept and user experience, but must not be presented as a production system. Do not build authentication, user accounts, team collaboration, live integrations, external database connections, email notifications, or production-grade privacy infrastructure. Use fictional or anonymized consulting and restaurant data only, and clearly tell users not to upload confidential company data.
Technology direction
Use TypeScript and React for the front end. Use Vite as the development and build tool, React Router for navigation, and Tailwind CSS for responsive styling and design consistency. Use a small local component library for shared buttons, cards, tables, forms, badges, dialogs, alerts, and empty states. Use Recharts or an equivalent React charting library for trends and comparisons.

The prototype should support CSV and Excel files locally in the browser. Use client-side parsers for those formats and validate the imported structure before it is used. Use schema validation for KPI definitions, mappings, dashboard state, and saved prototype data.

There is no database in the prototype. Persist the workspace locally in the browser so users can save, reopen, edit, and delete dashboards and uploaded source metadata without signing in. Treat the domain as relational in its design so a future production version could move to a relational database such as PostgreSQL.
Application experience
Create a clear application shell with four primary destinations: Dashboards, Data Sources, Alerts, and Settings. Keep a prominent Create Dashboard action visible from the dashboard home.

The creation experience should be a guided sequence with a visible step indicator:
1. Collect the user’s industry, sector, position, company or project context, and monitoring goal.
2. Recommend relevant KPIs and allow the user to select, remove, reorder, or define a custom KPI.
3. Allow multiple fictional sample files or local CSV and Excel files to be selected.
4. Inspect the files and show detected fields, file status, row and column information, and which KPIs can be calculated.
5. Suggest mappings between source fields and KPI inputs, showing confidence and requiring the user to confirm, edit, or leave mappings unresolved.
6. Show generation progress through reading data, matching fields, calculating results, checking quality, and assembling the dashboard.
7. Present the generated dashboard with KPI cards, trends, charts or tables, filters, freshness information, warnings, and source references.
8. Allow the user to edit the dashboard, save it, reopen it, or delete it.
Users must be able to move back through the creation steps without losing confirmed selections. Validation problems should move the user into a clear review state rather than silently failing. Generation errors should offer retry and return-to-mapping actions.
Data and domain model
Model the following as separate, traceable concepts:
- User context: industry, sector, position, company or project, and goal.
- Decision or assumption: expected outcome, rationale, date, and relevant period.
- KPI definition: name, description, formula, required inputs, unit, direction, target, warning threshold, and reporting period.
- Data source: file name, file type, sample or local-upload status, period, upload time, row count, field names, validation status, and freshness.
- Data mapping: source field, KPI input, confidence, and whether the mapping is suggested, confirmed, or unresolved.
- KPI result: calculated value, target, absolute and percentage variance, trend, status, period, comparison period, quality notes, and source references.
- Warning: priority, rule, changed values, impact, explanation, evidence, caveats, and possible next step.
- Dashboard: name, business context, selected KPI results, warnings, date range, comparison period, filters, layout, and update history.
The relationships should be clear: a context can have multiple assumptions and dashboards; a dashboard contains multiple KPI results and warnings; a data source can support multiple mappings; KPI definitions connect to mappings and results; and KPI results and warnings can reference one or more source files and fields.

Every KPI result and warning must be traceable to the original source file, relevant field, period, and calculation explanation wherever the information is available. The user should be able to drill down from a KPI card or warning to this supporting evidence.
Calculation and AI behavior
Keep business calculations deterministic. KPI values, variances, trends, statuses, and warning triggers should be produced from explicit formulas and rules so identical inputs always produce identical results.

Represent AI in the prototype with local, deterministic behavior. It may suggest field mappings, recommend KPIs, and produce plain-language explanations from structured facts, but it must not invent values or hide missing information. Use templates and rule-based explanations where possible.

Separate calculated facts, detected issues, possible recommendations, and uncertainty in the interface. Recommendations must be labeled as possible next steps, not guaranteed conclusions. The product should make clear that the responsible human remains accountable for business, investment, and operational decisions.
Front-end and CSS direction
Use Tailwind CSS to create a clean, calm, professional dashboard experience. Design for common laptop and tablet widths, with dashboard cards stacking on narrow screens and filters collapsing where necessary.

Use consistent tokens for spacing, typography, borders, surface colors, and status colors. Status colors must always be paired with text labels or icons; color cannot be the only indicator. Provide visible focus states, keyboard-accessible controls, readable contrast, labeled form fields, and text alternatives or adjacent summaries for charts.

The dashboard header should show the dashboard name, business context, last updated time, date range, comparison period, and edit action. Put the most important KPI cards and warnings first. Every card and warning should have an explicit detail action.

The upload and mapping experience should show the original file and field names alongside the system’s interpretation. Use explicit states such as confirmed, needs review, cannot calculate, invalid, and outdated. Do not hide unresolved mappings behind a generic success message.
Prototype persistence and limitations
Store the prototype workspace locally in the browser. Include sample consulting and restaurant scenarios with fictional data. Clearly label whether the current workspace uses sample data or local uploads. Provide visible controls to delete local sources and dashboards.

Include a settings and privacy area explaining what information is used, why it is used, when it was last updated, and why confidential business data should not be uploaded to this prototype. Include a placeholder for a future privacy policy.

Do not imply that the prototype has production authorization, retention controls, GDPR compliance, live synchronization, secure multi-user storage, or real external AI processing. Those are future production requirements.
Future production direction
If the concept is later productionized, use a TypeScript API, a relational database such as PostgreSQL, object storage for uploaded files, authentication and authorization, audit logging, retention and deletion policies, and explicit controls for sending data to external AI services. These services are intentionally outside the current prototype.
Definition of done
The prototype is successful when a first-time visitor can use sample data, complete the guided flow, select at least three meaningful KPI types, correct a suggested mapping, generate a dashboard, inspect a warning, verify its source and calculation, edit the dashboard, save it, reopen it, and delete it without signing in.

The interface must clearly distinguish fictional data from local uploads, expose missing or uncertain information, avoid presenting unresolved KPIs as valid results, support keyboard navigation, and preserve the principle that dAIshi highlights evidence and possible issues while the human makes the final decision.