import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    keyboard: "src/keyboard/index.ts",
    markdown: "src/markdown/index.ts",
    testing: "src/testing/index.ts",
    // The live example table. A Node host imports these nodes and renders them
    // in its own Ink tree; `showcase/previews.json` is the captured fallback for
    // consumers that cannot run Ink. Missing this entry would land the module in
    // source but leave it invisible to consumers.
    showcase: "src/showcase.tsx",
  },
  format: "esm",
  dts: true,
  sourcemap: true,
  deps: { neverBundle: ["react", "ink"] },
});
