import tailwind from "@tailwindcss/vite";

/** @type {import('@storybook/html-vite').StorybookConfig} */
export default {
  stories: ["../dist/**/stories/*.stories.js"],
  addons: ["@storybook/addon-essentials"],
  framework: { name: "@storybook/html-vite", options: {} },
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwind());
    return config;
  },
};
