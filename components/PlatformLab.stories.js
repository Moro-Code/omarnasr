import PlatformLab from "./PlatformLab";

export default {
  title: "Portfolio/Resilience Lab",
  component: PlatformLab,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1180, margin: "auto", padding: "0 20px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Interactive = {};
