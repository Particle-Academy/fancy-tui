import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    keyboard: "src/keyboard/index.ts",
    markdown: "src/markdown/index.ts",
    testing: "src/testing/index.ts",
  },
  format: "esm",
  dts: true,
  sourcemap: true,
  deps: { neverBundle: ["react", "ink"] },
});
