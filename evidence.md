# dAIshi user research evidence

## Key insights from the interviews

The interviews covered trading, real-estate investment, executive advisory, food operations, and mergers and acquisitions. These qualitative findings informed the [product requirements](product.md).

| Finding | Interview evidence | Prototype response |
| --- | --- | --- |
| Review actuals against an original decision or target | The real-estate analyst wanted to connect the investment thesis to actual performance. The food business founder wanted to compare sales, orders, and costs with forecasts. | Record a decision assumption and show the KPI value, target, and comparison period together. |
| Make every result inspectable | The food business founder asked for a source, comparison period, and calculation. The M&A participant wanted to check where each result came from. | Open a KPI or warning to see the formula, period, and confirmed source fields. |
| Prioritize deviations that matter | The senior advisor wanted an overview with drill-down. The trader wanted evidence-backed warnings that account for different timeframes. | Show rule-based warnings and let reviewers inspect the period and threshold that triggered them. |
| Reduce setup effort and protect sensitive inputs | The founder described fragmented spreadsheets and version confusion. Several participants emphasized reliability and confidentiality. | Use fictional examples, accept local CSV or XLSX files, and ask users to confirm field mappings before calculation. |

## Interview summaries

### Cash Equity Trader at Bank of America

#### Context

- Makes daily trading, investment, and business decisions.
- Worked on automating trading signals with a quant team.

#### Evidence-based needs

- Record trading signals and the assumptions behind them.
- Test assumptions using real trading decisions.
- Track PnL for different signals.
- Compare current information with previous data points and related cases.
- Detect when a signal works for one time frame but not another, such as daily versus monthly.
- Reduce the time required for investment and process decisions.

#### Requirements and constraints

- Warnings must account for a constantly changing investment process.
- Warnings should be supported by experience and evidence that they are correct.
- Accuracy is critical because investment decisions include subjectivity.
- The tool must shorten the process without reducing accuracy.

### Investment Analyst at Adam America

#### Context

- Performs market research, financial analysis, and investment evaluation.
- Evaluates assumptions such as occupancy, rental income, operating expenses, financing costs, and exit valuations.

#### Evidence-based needs

- Compare original financial projections with updated market data and actual performance.
- Monitor occupancy rates, rental income, operating costs, interest rates, and market valuations.
- Use sensitivity analysis to identify the effect of changed assumptions.
- Show how a change affects expected return on investment.
- Connect the original investment thesis with actual performance.
- Provide clear alerts when changes may materially affect returns.

#### Requirements and constraints

- Integrate directly with Excel financial models.
- Use reliable data and explain what changed.
- Show the financial impact of each change.
- Avoid excessive irrelevant alerts.
- Protect confidentiality and maintain accuracy.
- Reduce work instead of creating extra tasks.
- Potential users include investment analysts, asset managers, investment managers, and senior executives.

### Senior Advisor supporting CEOs

#### Context

- Supports several CEOs across multiple deals.
- Assesses opportunities, flags risks, challenges assumptions, and supports final decision-makers.

#### Evidence-based needs

- Provide one control-panel view of what matters today across all active deals.
- Show, for each deal, key figures, timelines, changed assumptions, and deviations since the previous review.
- Present important information first and allow drill-down into details.
- Provide prioritized warnings about changing assumptions.
- Use simple warning levels, such as blue for medium issues and red for important issues.

#### Requirements and constraints

- CEOs are the main users; advisors use the tool to support them.
- Warnings must be relevant and important enough to require attention.
- The tool must reduce workload rather than add work.
- It must protect confidentiality and provide accurate results.
- It must be clean, simple, fast, and require little training.

### Cero Gradors founder & Owner (Frozen fish Brand)

#### Context

- Makes decisions about production, product launches, supermarket orders, pricing, and costs.
- Stores information across Excel files, emails, WhatsApp conversations, and meeting notes.

#### Evidence-based needs

- Compare forecasts or goals with actual sales, supermarket orders, inventory, production costs, and margins.
- Track daily or weekly sell-out data.
- Track inventory by supermarket and confirmed orders.
- Identify weak demand, excess inventory, rising costs, and falling margins.
- Show the cause of deviations.
- Suggest possible solutions.

#### Requirements and constraints

- Handle documents spread across folders and conversations.
- Help identify the latest version when several versions of an Excel file exist.
- Show the data source, comparison period, and calculation behind each alert.
- Do not rely on outdated data.
- Address confidentiality, incorrect data, AI hallucinations, and manual update effort.
- Be simple, easy to learn, reliable, and accurate.
- A serious failure could cause the user to stop trusting the tool.

### Business Decision-Making, Mergers & Acquisitions, and Information Management

#### Context

- Makes strategic and major business decisions and oversees company operations.
- Works with mergers, acquisitions, company integration, investment attractiveness, and potential synergies.

#### Evidence-based needs

- Monitor acquisition-related financial information, including ROI, EBITDA, and other performance indicators.
- Detect risks that may be missed during manual reviews.
- Recognize patterns in historical data.
- Detect inconsistencies between documents.
- Identify mismatched financial figures.
- Flag overlooked risks.
- Support the finance department with financial information and analysis.

#### Requirements and constraints

- Show the source of the information used for each KPI or warning.
- Support human judgment, relationships, meetings, and communication rather than replacing them.
- Protect confidential acquisition-related information.
- Provide reliable results.

## Cross-interview product requirements

#### Core workflow

- Capture the original assumptions behind a decision.
- Store the assumptions with their source documents and relevant time period.
- Connect assumptions to updated operational, financial, market, or trading data.
- Compare projected and actual values.
- Detect deviations, inconsistencies, and changed assumptions.
- Explain the potential financial or operational impact.
- Prioritize warnings by importance.
- Let users drill down into the supporting data and source documents.
- Allow teams to review, communicate, and follow up on risks.

#### Common data requirements

- Original assumptions and decision rationales
- Forecasts and targets
- Actual performance data
- Financial indicators
- Market and industry data
- Operational data
- Time periods and comparison periods
- Source documents and source references
- Historical versions of files or assumptions
- Alert calculations and evidence

#### Common alert requirements

- Explain what changed.
- Show the comparison period.
- Show the data source.
- Show the calculation behind the alert.
- Indicate the financial or operational impact.
- Prioritize important warnings.
- Avoid irrelevant or outdated alerts.
- Allow users to verify warnings against alternative data or related cases.

#### Common trust and adoption requirements

- Accurate input data
- Reliable calculations
- Clear evidence behind warnings
- Transparency about sources and changes
- Confidentiality and data security
- Protection against AI hallucinations and model bias
- Integration with existing tools, especially Excel
- Minimal manual data entry
- A simple, fast, intuitive interface
- Low learning curve
- No additional workload for users

#### MVP evidence priorities

The interviews most strongly support an MVP that demonstrates:

- A dashboard showing multiple decisions or deals in one overview.
- Assumption cards with original value, current value, deviation, and time period.
- Forecast-versus-actual comparisons.
- KPI monitoring for financial, operational, market, and trading data.
- Prioritized alerts with clear explanations and source references.
- Drill-down from an alert to the supporting data or document.
- Impact explanation, especially expected return or financial effect.
- Excel and CSV upload or integration for prototype data.
- Historical comparison and related-case comparison.
- A clean, fast interface using fictional or anonymized data.

#### Evidence-based non-goals for the MVP

The interviews do not support replacing human investment judgment, relationships, meetings, or final decision-making. The tool should support review and risk detection while leaving decisions with the responsible people.

---

## Early concept notes

These notes capture the initial consulting concept. See the [product requirements](product.md) and [architecture](architecture.md) for the submitted prototype scope.


This document defines the purpose, scope, user experience, and data requirements for a personalized AI dashboard app. It is based on the product discussion and uses a consulting company as the initial example industry.
Summary of the Main Sections
1. Purpose and problem
The app helps company employees define the KPIs they want to monitor, upload business information, and automatically receive a personalized, editable AI dashboard. It solves the problem of scattered, difficult-to-understand data and the technical effort required to build dashboards manually.
2. Scope and features
The MVP focuses on three steps: defining KPIs, uploading information, and generating a dashboard with AI. Later versions can include alerts, live integrations, collaboration, and support for more industries. Complex enterprise features are outside the initial scope.
3. User flows and screens
The user selects an area to monitor, chooses KPIs, uploads data, confirms how the data should be used, and generates a dashboard. The app needs screens for onboarding, KPI selection, file upload, data validation, dashboard creation, editing, saved dashboards, alerts, and settings.
4. Data and content
The app stores KPI definitions, uploaded files, data mappings, calculated results, dashboard layouts, and alert settings. The MVP can use fictional Excel or CSV data from a consulting company. Privacy, controlled access, deletion, and GDPR should be considered before using real company data.





1. Purpose And Problem
One-sentence summary
The app is a personalized AI dashboard creator that helps company employees define the KPIs they care about, upload or connect their business information, and automatically generate an editable dashboard for their department or team.
For the prototype, the example user is someone working in a consulting company who wants to monitor projects, sales, clients, finances, or team performance.
The problem it solves
Many companies already have information stored across Excel files, Google Sheets, and internal systems, but the data is difficult to understand and use. Creating a useful dashboard usually requires technical knowledge, manual setup, or a dashboard that was programmed specifically for one department.
Existing tools often provide fixed dashboards or require users to build everything themselves. This app allows users to decide what they want to monitor and then lets AI organize their data into a personalized dashboard.
The main difference is that the dashboard is generated from the user’s goals, chosen KPIs, and uploaded information rather than being a fixed template.
Success criteria
The app works if a user can:
Define the KPIs they want to monitor.
Upload their data.
Have the system identify and connect the relevant information.
Receive a useful first dashboard.
Understand the dashboard without technical help.
Edit the dashboard if needed.
For the MVP, a reasonable target is that a user can create a basic dashboard in under 10 minutes. The dashboard should also calculate the selected KPIs accurately and clearly show where the information came from.
2. Scope And Features
Core features: MVP
The MVP should focus on the following three-step process:
1. Define KPIs
The user chooses what they want to monitor. They can select KPIs such as revenue, active projects, project completion, client satisfaction, team utilization, or overdue tasks. They can also define targets or warning thresholds.
2. Upload information
The user uploads Excel or CSV files. The app accepts multiple files and checks whether the uploaded information contains the data needed for the selected KPIs.
3. Generate the dashboard
AI analyzes the selected KPIs and uploaded data, calculates the KPI values, and creates a dashboard with KPI cards, charts, tables, and trends. The user can then edit the result.
The MVP should use a fictional consulting company and sample data so students can demonstrate the concept without needing access to real company systems.
Nice-to-have features for later versions
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
Explicit non-goals for the MVP
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
3. User Flows And Screens
Main user journey
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
Main screens
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
Edge cases
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
4. Data And Content
Data the app stores, creates, or displays
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
Where the data comes from
For the MVP, data can come from Excel files, CSV files, and fictional sample data.
In later versions, the app could connect to Google Sheets, company information systems, CRM platforms, project-management tools, finance or HR software, APIs, and live databases.
The user should always be able to see which source was used for each KPI.
Privacy, retention, and deletion
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
