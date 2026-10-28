design.md — The design system and Storybook documentation: visual language, components, interface patterns, and relevant screen designs. 

Can use claude design or figma, the visualization of the project, create a story motion, all the types of user interface elements 

dAIshi Design System
Product Character
dAIshi is a calm, practical operations dashboard for restaurant teams. The interface should feel trustworthy, quietly premium, and human rather than overly technical.

Dense business information is balanced with generous spacing, restrained color, serif display typography, and clear status cues.
Visual Foundations
Color
The default theme uses a warm, near-white canvas and white surfaces.

Ink: #20211f
Used for primary text, dark controls, and chart lines.

Muted: #72756f
Used for supporting text, labels, and metadata.

Canvas: #f4f5f2
Used for the application background.

Surface: #ffffff
Used for cards, panels, and forms.

Line: #e2e4de
Used for borders and dividers.

Green: #31715b
Used for positive states and primary accents.

Soft Green: #e9f3ee
Used for positive status backgrounds.

Red: #a4493e
Used for negative or high-severity states.

Soft Red: #f8ece9
Used for negative status backgrounds.

Amber: #9a6c24
Used for warnings, targets, and watch states.

Soft Amber: #f8f0df
Used for warning backgrounds.

Dark mode uses a deep olive-black canvas, dark surfaces, softened light text, and brighter accent colors for contrast.
Typography
UI text uses Inter, SF Pro Text, or Segoe UI for a compact and highly legible appearance.

Display headings and key metric values use Georgia or Times New Roman at a medium weight with tight letter spacing.

Eyebrows and status labels are small, uppercase, bold, and use increased letter spacing.

Supporting text uses muted gray to establish hierarchy.
Layout
The desktop layout uses a fixed 240-pixel sidebar and a fluid main content area.

Main content is centered with a maximum width of approximately 1,500 pixels and generous horizontal padding.

The dashboard follows this structure:

Page header
Context bar
KPI grid
Chart and warnings section
Data sources table

Dashboard grids use compact spacing, while sections have approximately 26 to 30 pixels of vertical separation.

At widths below 1,100 pixels, the chart and warnings stack vertically.

At widths below 760 pixels, the sidebar becomes a sticky top navigation bar and content padding is reduced.
Components
Navigation
The sidebar contains the dAIshi brand, a primary “New dashboard” action, navigation items, theme switching, workspace information, and the user profile.

The active navigation item uses a light gray background and semibold text.

Alerts display a red count pill.
Buttons
Primary buttons use a dark ink background, white text, a 40 to 42-pixel height, and a semibold label.

Secondary buttons use a white background with a 1-pixel border. Their selected state uses a light gray background.

Text buttons are borderless and use muted text for low-emphasis actions.

Icon buttons are approximately 34 pixels square and become lightly shaded on hover.

All buttons should display a visible green focus ring when selected using the keyboard.
Status Pills
Status pills are compact, rounded labels with a small colored dot.

Good status uses green text on a soft green background.

Bad or high-severity status uses red text on a soft red background.

Watch or medium-severity status uses amber text on a soft amber background.

Sample status uses a neutral gray-green treatment.
KPI Cards
KPI cards are clickable panels containing a label, status pill, large serif value, target, delta, and latest-update information.

The main value should be visually dominant. Target and delta information should remain secondary.

Delta colors should use the appropriate semantic color rather than decorative graphics.
Data Visualization
Charts should remain restrained and easy to interpret.

Use thin grid lines, a dark revenue line, a dashed amber cost line, and a muted green target line.

Legends should be small and right-aligned.

Avoid overly saturated fills and unnecessary chart decoration.
Alerts and Warnings
Warnings use a tinted icon tile, a short bold title, muted supporting information, and a right-aligned severity pill.

High-severity warnings use red.

Medium-severity warnings use amber.

Human notes appear in a neutral gray-green inset panel.
Drawers and Modals
Details open in a right-side drawer over a blurred translucent backdrop.

Creation flows use a centered modal with rounded corners, step indicators, choice cards, and a clear footer.

The backdrop should establish focus without making the page feel visually heavy.
Interaction Principles
Use progressive disclosure. Show the metric first, then open detail views for formulas, evidence, and insights.

Preserve context when opening drawers or modals. Users should not leave the dashboard to view a single detail.

Use hover states for discoverability, but never make essential information available only through hover.

Keep transitions short and subtle, generally between 150 and 250 milliseconds.

Use semantic colors consistently. Green, red, and amber should communicate meaning rather than serve as decoration.
Accessibility and Responsive Behavior
Maintain visible focus states for buttons, selects, and text areas.

Icon-only controls should have accessible names or labels.

Text and background combinations should maintain strong contrast in both light and dark themes.

Interactive controls should provide touch targets of at least 34 to 42 pixels.

On mobile, secondary navigation labels may be hidden, but accessible names and alert counts must remain available.
Content Voice
Use concise, operational language such as:

Monthly revenue

Food cost

Needs attention

Fictional data only

Titles should be specific and human.

Supporting copy should explain why a metric matters or what action is recommended without sounding alarmist.

