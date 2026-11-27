import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { fn } from "storybook/test";
import { buildDashboard, newDraft } from "../app/workflow";
import { suggestMappings } from "../domain/mappingRules";
import type { Scenario } from "../domain/models";
import {
  createSampleSources,
  getDefaultRanges,
} from "../domain/sampleScenarios";
import { generateWarnings } from "../domain/warningRules";
import { DashboardView } from "./DashboardView";
import { SourceDetails } from "./Management";

const sampleDate = "2026-10-31T12:00:00Z";

function makeDashboard(scenario: Scenario, confirmMappings: boolean) {
  const draft = newDraft(scenario);
  const sources = createSampleSources(scenario);
  const mappings = suggestMappings(sources, draft.definitions).map((mapping) =>
    confirmMappings && mapping.sourceField
      ? { ...mapping, status: "confirmed" as const }
      : mapping,
  );

  return buildDashboard({
    ...draft,
    ...getDefaultRanges(sources),
    sources,
    mappings,
  });
}

function DashboardExample({
  dashboard,
  onUpdate,
}: Pick<ComponentProps<typeof DashboardView>, "dashboard" | "onUpdate">) {
  const [view, setView] = useState(dashboard);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const source = view.sources.find(({ id }) => id === sourceId);

  function update(next: typeof view) {
    const result = buildDashboard(next, next.name, next);
    setView(result);
    onUpdate(result);
  }

  const warnings = generateWarnings(
    view.kpiResults,
    view.sources,
    view.definitions,
    sampleDate,
  );

  return (
    <main className="content">
      <DashboardView
        dashboard={{ ...view, updatedAt: sampleDate, warnings }}
        onUpdate={update}
        onReviewSource={setSourceId}
      />
      {source && (
        <SourceDetails source={source} onClose={() => setSourceId(null)} />
      )}
    </main>
  );
}

const meta = {
  title: "Patterns/Dashboard",
  component: DashboardExample,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: { story: { inline: false, height: "680px" } },
  },
  args: { onUpdate: fn() },
  render: (args) => <DashboardExample key={args.dashboard.id} {...args} />,
} satisfies Meta<typeof DashboardExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Restaurant: Story = {
  args: { dashboard: makeDashboard("restaurant", true) },
};
export const Consulting: Story = {
  args: { dashboard: makeDashboard("consulting", true) },
};
export const UnconfirmedMappings: Story = {
  args: { dashboard: makeDashboard("restaurant", false) },
};
