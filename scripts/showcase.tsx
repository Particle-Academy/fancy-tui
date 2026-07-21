/**
 * Showcase capture — renders every example with real Ink and records the
 * resulting ANSI frame into `showcase/previews.json`.
 *
 * The examples themselves live in `src/showcase.tsx` and are exported as
 * `@particle-academy/fancy-tui/showcase`, so a Node host (the docs TUI) renders
 * the LIVE component rather than a picture of one. This script exists for the
 * consumers that cannot run Ink — the web gallery is a browser page — so the
 * frames it writes are a DERIVED artifact, not the source of truth.
 *
 * Rendering the real component is what keeps the docs honest: hand-authored
 * terminal art does not survive contact with reality (the site's first four
 * hand-written examples had 79/78/77-column borders inside one box, because a
 * human counted dashes).
 *
 * Run: npm run showcase  (writes showcase/previews.json)
 */
import React from "react";
import { render } from "ink-testing-library";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FancyTuiProvider } from "../src/theme.js";
import { Box } from "../src/layout.js";
import { SHOWCASE_EXAMPLES, SHOWCASE_COLUMNS } from "../src/showcase.js";

const settle = () => new Promise((r) => setTimeout(r, 30));

async function main() {
  // Ink/chalk decide colour support at import time and disable it when stdout
  // is not a TTY — which it never is here. Re-exec once with FORCE_COLOR set so
  // the captured frames carry real ANSI instead of plain text. Doing it here
  // rather than in the npm script keeps this working on Windows shells, where
  // a `FORCE_COLOR=3 node …` prefix is not valid syntax.
  if (!process.env.FORCE_COLOR) {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      stdio: "inherit",
      env: { ...process.env, FORCE_COLOR: "3" },
    });
    process.exit(result.status ?? 1);
  }

  const out: Array<Record<string, unknown>> = [];
  for (const entry of SHOWCASE_EXAMPLES) {
    // Constrain layout to the documented width. Ink otherwise fills the
    // harness' default 100 columns, and a docs site rendering the frame in a
    // narrower pane would clip every border.
    const view = render(
      <FancyTuiProvider>
        <Box width={SHOWCASE_COLUMNS} flexDirection="column">{entry.node}</Box>
      </FancyTuiProvider>,
    );
    await settle();
    const frame = view.lastFrame() ?? "";
    view.unmount();
    if (!frame.trim()) {
      console.error(`  !! ${entry.slug} rendered an empty frame`);
    }
    out.push({ slug: entry.slug, name: entry.name, group: entry.group, source: entry.source, frame, columns: SHOWCASE_COLUMNS });
    console.log(`  ✓ ${entry.name}`);
  }

  // Resolve against the package root, not the compiled script's location —
  // this file runs from .showcase-dist/scripts/, so a relative hop would bury
  // the artifact inside the build output.
  const dir = resolve(process.cwd(), "showcase");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "previews.json");
  writeFileSync(file, JSON.stringify({ generated: true, components: out }, null, 2) + "\n");
  console.log(`\nCaptured ${out.length} components → ${file}`);
}

void main();
