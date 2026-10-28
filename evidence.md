# evidence.md — Key insights from user research: personas, user activities or situations, needs or desired outcomes, and barriers or frustrations. Use the format: “As a [persona], I want to [action] because [need], but [obstacle].”

## ALL INTERVIEWS

**Interviews:**

### A President of China Construction Bank

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

### Core workflow

- Capture the original assumptions behind a decision.
- Store the assumptions with their source documents and relevant time period.
- Connect assumptions to updated operational, financial, market, or trading data.
- Compare projected and actual values.
- Detect deviations, inconsistencies, and changed assumptions.
- Explain the potential financial or operational impact.
- Prioritize warnings by importance.
- Let users drill down into the supporting data and source documents.
- Allow teams to review, communicate, and follow up on risks.

### Common data requirements

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

### Common alert requirements

- Explain what changed.
- Show the comparison period.
- Show the data source.
- Show the calculation behind the alert.
- Indicate the financial or operational impact.
- Prioritize important warnings.
- Avoid irrelevant or outdated alerts.
- Allow users to verify warnings against alternative data or related cases.

### Common trust and adoption requirements

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

## MVP evidence priorities

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

## Evidence-based non-goals for the MVP

The interviews do not support replacing human investment judgment, relationships, meetings, or final decision-making. The tool should support review and risk detection while leaving decisions with the responsible people.
