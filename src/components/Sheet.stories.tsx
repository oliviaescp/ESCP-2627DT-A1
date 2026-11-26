import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Sheet, type SheetProps } from "./Sheet";

function SheetExample({ onClose, ...args }: SheetProps) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
    onClose();
  }

  return (
    <>
      <button className="primary" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      {open && (
        <Sheet
          {...args}
          onClose={close}
          footer={
            <button className="secondary" onClick={close}>
              Done
            </button>
          }
        />
      )}
    </>
  );
}

const meta = {
  title: "Components/Bottom sheet",
  component: Sheet,
  argTypes: {
    children: { control: "text" },
    footer: { control: false },
    onClose: { control: false },
  },
  render: (args) => <SheetExample {...args} />,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SourceDetails: Story = {
  args: {
    title: "Source details",
    eyebrow: "Fictional sample",
    children: "Restaurant sample data covers May through October 2026.",
    onClose: () => {},
  },
};
