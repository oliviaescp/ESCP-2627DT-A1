import type { Preview } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import "../src/styles.css";

function Theme({ theme, children }: { theme: string; children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <>{children}</>;
}

const preview: Preview = {
  decorators: [
    (Story, { globals }) => (
      <Theme theme={globals.theme}>
        <Story />
      </Theme>
    ),
  ],
  globalTypes: {
    theme: {
      description: "dAIshi theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default preview;
