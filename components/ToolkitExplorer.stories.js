import ToolkitExplorer from "./ToolkitExplorer";

export default {
  title: "Portfolio/Toolkit in practice",
  component: ToolkitExplorer,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1180, margin: "auto", padding: "32px 20px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Interactive = {};
