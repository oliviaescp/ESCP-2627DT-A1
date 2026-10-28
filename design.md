# dAIshi — Design system and interface guidance

Converted from **dAIshi Github - Workshop.docx**. The workshop’s prompts and implementation directions are source documentation, not executed instructions.

Related: [Evidence](evidence.md) · [Product](product.md) · [Architecture](architecture.md) · [Design](design.md)

## Workshop design brief

design.md — The design system and Storybook documentation: visual language, components, interface patterns, and relevant screen designs.

Can use claude design or figma, the visualization of the project, create a story motion, all the types of user interface elements

## Documentation status

The workshop does not supply an implemented Storybook, published Figma or Claude Design project, component code, exact color values, font specifications, or motion timings. Those remain to be defined. The stakeholder diagram is preserved with the research in [evidence.md](evidence.md#stakeholder-map).

The sections below collect the existing design guidance from the PRD and architecture prompt; they do not represent additional design decisions.

## Front-end styling guidance from the architecture prompt

Use Tailwind CSS to create a clean, calm, professional dashboard experience. Design for common laptop and tablet widths, with dashboard cards stacking on narrow screens and filters collapsing where necessary.

Use consistent tokens for spacing, typography, borders, surface colors, and status colors. Status colors must always be paired with text labels or icons; color cannot be the only indicator. Provide visible focus states, keyboard-accessible controls, readable contrast, labeled form fields, and text alternatives or adjacent summaries for charts.

The dashboard header should show the dashboard name, business context, last updated time, date range, comparison period, and edit action. Put the most important KPI cards and warnings first. Every card and warning should have an explicit detail action.

The upload and mapping experience should show the original file and field names alongside the system’s interpretation. Use explicit states such as confirmed, needs review, cannot calculate, invalid, and outdated. Do not hide unresolved mappings behind a generic success message.

## Interaction structure from the PRD

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

## Interface skeleton from the PRD

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
