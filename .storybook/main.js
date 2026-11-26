export default {
  stories: [
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
  ],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  async viteFinal(config) {
    // Story files are .js with JSX. Vite 8's dependency scan parses .js as
    // plain JavaScript unless this is set, then skips pre-bundling.
    config.optimizeDeps ??= {};
    config.optimizeDeps.rolldownOptions ??= {};
    config.optimizeDeps.rolldownOptions.moduleTypes = {
      ...config.optimizeDeps.rolldownOptions.moduleTypes,
      ".js": "jsx",
    };
    return config;
  },
};
