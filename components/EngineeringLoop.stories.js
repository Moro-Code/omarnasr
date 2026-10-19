import EngineeringLoop from "./EngineeringLoop";

export default {
  title: "Portfolio/Engineering Loop",
  component: EngineeringLoop,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480, margin: "auto" }}>
        <Story />
      </div>
    ),
  ],
};

export const Interactive = {};
