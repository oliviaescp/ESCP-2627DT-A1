import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Components/Status badge",
  component: Badge,
  argTypes: {
    status: {
      control: "select",
      options: ["on-track", "watch", "critical", "unavailable", "sample"],
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTrack: Story = { args: { status: "on-track" } };
export const Watch: Story = { args: { status: "watch" } };
export const NeedsAttention: Story = { args: { status: "critical" } };
export const Unavailable: Story = { args: { status: "unavailable" } };
export const SampleData: Story = { args: { status: "sample" } };
