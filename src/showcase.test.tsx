import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";

import { FancyTuiProvider } from "./theme.js";
import { Box } from "./layout.js";
import {
  SHOWCASE_COLUMNS,
  SHOWCASE_EXAMPLES,
  findShowcaseExample,
} from "./showcase.js";

/**
 * The example table is a published API, not a build-script detail: a docs host
 * imports it and renders `example.node` live. So it gets the same treatment as
 * any other export — the nodes have to actually draw, and the captured
 * `showcase/previews.json` has to stay a faithful derivative of it.
 */

afterEach(() => cleanup());

const settle = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); };

it("exports a unique, fully-populated slug for every example", () => {
  assert.ok(SHOWCASE_EXAMPLES.length >= 60);

  const slugs = new Set<string>();
  for (const example of SHOWCASE_EXAMPLES) {
    assert.match(example.slug, /^[a-z0-9-]+$/, `bad slug: ${example.slug}`);
    assert.ok(!slugs.has(example.slug), `duplicate slug: ${example.slug}`);
    slugs.add(example.slug);
    assert.ok(example.name.length > 0, `${example.slug} has no name`);
    assert.ok(example.group.length > 0, `${example.slug} has no group`);
    assert.ok(example.source.trim().length > 0, `${example.slug} has no source`);
    assert.notEqual(example.node, undefined, `${example.slug} has no node`);
  }
});

it("looks an example up by slug", () => {
  const badge = findShowcaseExample("badge");
  assert.equal(badge?.name, "Badge");
  assert.equal(findShowcaseExample("not-a-component"), undefined);
});

it("renders every example to a non-empty frame", async () => {
  // The whole point of exporting live nodes: a host renders them directly. An
  // example that draws nothing would show a host an empty pane, and — because
  // Ink blanks a WHOLE subtree when text sits directly in a Box — that failure
  // is silent, with nothing on stderr.
  const empty: string[] = [];

  for (const example of SHOWCASE_EXAMPLES) {
    const view = render(
      <FancyTuiProvider>
        <Box width={SHOWCASE_COLUMNS} flexDirection="column">{example.node}</Box>
      </FancyTuiProvider>,
    );
    await settle();
    if (!(view.lastFrame() ?? "").trim()) empty.push(example.slug);
    view.unmount();
  }

  assert.deepEqual(empty, []);
});

it("marks exactly the examples a windowed host cannot clip", async () => {
  // The contract `scrollback` documents, asserted rather than asserted-about: a
  // host renders these nodes into a pane of a fixed size, and everything it is
  // NOT warned about has to stay inside that pane. Ink's `Static` writes above
  // the live frame and outside the box model, so an unflagged example using it
  // would silently paint over the host's own header — which is exactly what
  // MessageList did before it was flagged.
  const BOX_ROWS = 6;
  const escaped: string[] = [];

  for (const example of SHOWCASE_EXAMPLES) {
    const view = render(
      <FancyTuiProvider>
        <Box width={SHOWCASE_COLUMNS} height={BOX_ROWS} overflow="hidden" flexDirection="column">
          <Box flexDirection="column" flexShrink={0}>{example.node}</Box>
        </Box>
      </FancyTuiProvider>,
    );
    await settle();
    const rows = (view.lastFrame() ?? "").split("\n").length;
    view.unmount();
    if (rows > BOX_ROWS) escaped.push(example.slug);
  }

  assert.deepEqual(
    escaped.sort(),
    SHOWCASE_EXAMPLES.filter((e) => e.scrollback).map((e) => e.slug).sort(),
  );
});

it("keeps showcase/previews.json a faithful capture of the table", () => {
  // The JSON is DERIVED — `npm run showcase` renders this same table for
  // consumers that cannot run Ink. If someone adds an example and forgets to
  // re-capture, the web gallery silently misses a component.
  const file = resolve(process.cwd(), "showcase", "previews.json");
  const captured = JSON.parse(readFileSync(file, "utf8")) as {
    components: Array<{ slug: string; name: string; group: string; source: string; frame: string }>;
  };

  assert.deepEqual(
    captured.components.map((c) => c.slug),
    SHOWCASE_EXAMPLES.map((e) => e.slug),
  );

  for (const [i, example] of SHOWCASE_EXAMPLES.entries()) {
    const capture = captured.components[i]!;
    assert.equal(capture.name, example.name, `${example.slug}: stale name`);
    assert.equal(capture.group, example.group, `${example.slug}: stale group`);
    assert.equal(capture.source, example.source, `${example.slug}: stale source`);
    assert.ok(capture.frame.trim().length > 0, `${example.slug}: empty captured frame`);
  }
});

// ── Interactivity ───────────────────────────────────────────────────────────
// The reason the interactive nodes stopped being frozen: a host renders one
// persistently and forwards keystrokes, and the component has to actually
// respond. Each case below renders a real example, feeds it ONE key, and
// asserts the frame changed — the proof a no-op `onChange` would fail. The
// cases span the ways a Fancy TUI control takes input (enter to toggle, a
// character to type, a number to select, an arrow to move) so a regression in
// any one wiring surfaces, not just a single lucky path.
const ESC = String.fromCharCode(27); // escape byte, without a raw control char in source
const respondsCases: Array<{ slug: string; key: string; how: string }> = [
  { slug: "accordion", key: "\r", how: "enter toggles the focused section shut" },
  { slug: "input", key: "z", how: "a character appends to the value" },
  { slug: "select", key: "1", how: "a number key picks the first option" },
  { slug: "slider", key: ESC + "[C", how: "right arrow nudges the value up" },
];

for (const { slug, key, how } of respondsCases) {
  it(`responds to a keystroke: ${slug} — ${how}`, async () => {
    const example = findShowcaseExample(slug);
    assert.ok(example?.interactive, `${slug} should be flagged interactive`);

    const view = render(
      <FancyTuiProvider>
        <Box width={SHOWCASE_COLUMNS} flexDirection="column">{example!.node}</Box>
      </FancyTuiProvider>,
    );
    await settle();
    const before = view.lastFrame() ?? "";
    view.stdin.write(key);
    await settle();
    const after = view.lastFrame() ?? "";
    view.unmount();

    assert.notEqual(after, before, `${slug}: frame unchanged after keystroke — it did not respond`);
  });
}

it("flags exactly the keyboard-interactive examples", () => {
  // The `interactive` contract, asserted rather than asserted-about: the flag is
  // set on every example whose component calls `useInput`/`useFocus` (directly or
  // via a Button/Input child) and unset on the rest — including the display
  // components that take controlled props but have no keyboard handling of their
  // own (Table, TreeNav, FileBrowser, Sidebar respond to agent commands, not
  // keystrokes) and the two `scrollback` lists.
  const interactive = SHOWCASE_EXAMPLES.filter((e) => e.interactive).map((e) => e.slug).sort();
  assert.deepEqual(interactive, [
    "accordion", "autocomplete", "button", "checkbox", "checkbox-group",
    "command", "composer", "drawer", "field", "form", "input", "menu",
    "modal", "multi-switch", "multiline-input", "pagination", "pillbox",
    "radio-group", "select", "slider", "switch", "tabs",
  ].sort());

  // Spot-check the classification from both directions — a known-static example
  // must never carry the flag, and a known-interactive one must.
  for (const slug of ["badge", "separator", "heading", "text", "hero", "card", "status-bar", "markdown", "code-view", "table", "tree-nav", "file-browser", "sidebar", "message-list", "static-list"]) {
    assert.ok(!findShowcaseExample(slug)?.interactive, `${slug} should NOT be interactive`);
  }
  for (const slug of ["accordion", "input", "select", "slider", "tabs", "menu", "modal", "drawer"]) {
    assert.ok(findShowcaseExample(slug)?.interactive, `${slug} should be interactive`);
  }
});
