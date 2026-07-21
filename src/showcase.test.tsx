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
