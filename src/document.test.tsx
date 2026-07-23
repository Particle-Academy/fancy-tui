import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { FancyTuiProvider } from "./theme.js";
import { Text } from "./layout.js";
import {
  DocumentViewer,
  getDocumentExtensions,
  registerDocumentExtension,
  segmentDocument,
  unregisterDocumentExtension,
} from "./document.js";

afterEach(() => cleanup());

const settled = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); };
const lines = (n: number) => Array.from({ length: n }, (_, i) => `line-${i + 1}`).join("\n");

// ── Segmentation ────────────────────────────────────────────────────────────

it("returns the whole document as markdown when nothing is registered", () => {
  assert.deepEqual(segmentDocument("# Title", []), [{ type: "markdown", content: "# Title" }]);
});

it("splits a registered custom tag out of the surrounding markdown", () => {
  const ext = { tag: "thinking", component: () => null };
  const segs = segmentDocument("before\n<thinking>secret</thinking>\nafter", [ext]);
  assert.equal(segs.length, 3);
  assert.equal(segs[0]?.type, "markdown");
  assert.deepEqual(segs[1], { type: "extension", tag: "thinking", content: "secret", attributes: {} });
  assert.equal(segs[2]?.type, "markdown");
});

it("parses attributes off the opening tag", () => {
  const ext = { tag: "plan", component: () => null };
  const segs = segmentDocument(`<plan status="done" id='7' flag>body</plan>`, [ext]);
  const seg = segs[0];
  assert.equal(seg?.type, "extension");
  assert.deepEqual(seg.type === "extension" ? seg.attributes : null, { status: "done", id: "7", flag: "" });
});

it("parses a bare dash-heavy attribute name alongside a quoted one", () => {
  // Guards the rewrite of the attribute parser away from the 3-branch
  // alternation CodeQL flagged as polynomial ReDoS (js/polynomial-redos). A
  // timing assertion is NOT used: a single dash run is linear even for the old
  // regex, so it cannot distinguish the two — CodeQL re-scanning the rewritten
  // regex is the real gate. This asserts the behaviour the rewrite must keep:
  // a bare `[\w-]+` name and a quoted value on the same tag both parse.
  const ext = { tag: "plan", component: () => null };
  const segs = segmentDocument(`<plan data-a-b-c status="ok">body</plan>`, [ext]);
  const seg = segs[0];
  assert.equal(seg?.type, "extension");
  assert.deepEqual(seg.type === "extension" ? seg.attributes : null, { "data-a-b-c": "", status: "ok" });
});

it("matches tags case-insensitively", () => {
  const segs = segmentDocument("<THINKING>x</THINKING>", [{ tag: "thinking", component: () => null }]);
  assert.equal(segs[0]?.type, "extension");
});

it("leaves an UNREGISTERED tag as literal markdown", () => {
  // Dropping unknown tags would silently eat content — a typo should be visible.
  const segs = segmentDocument("<unknown>x</unknown>", [{ tag: "thinking", component: () => null }]);
  assert.equal(segs.length, 1);
  assert.equal(segs[0]?.type, "markdown");
});

// ── Registry ────────────────────────────────────────────────────────────────

it("registers, replaces by tag, and unregisters", () => {
  const first = { tag: "demo", component: () => null };
  const second = { tag: "DEMO", component: () => null };
  registerDocumentExtension(first);
  registerDocumentExtension(second);
  assert.equal(getDocumentExtensions().filter((e) => e.tag.toLowerCase() === "demo").length, 1);
  assert.equal(unregisterDocumentExtension("demo"), true);
  assert.equal(unregisterDocumentExtension("demo"), false);
});

// ── Scrolling ───────────────────────────────────────────────────────────────

it("shows only a viewport of a document taller than the terminal", async () => {
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={lines(50)} format="text" height={5} />
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /line-1\b/);
  assert.doesNotMatch(frame, /line-20\b/);
});

it("reports its position", async () => {
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={lines(50)} format="text" height={5} />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", /1–5 \/ 50/);
});

it("honours a controlled scroll offset", async () => {
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={lines(50)} format="text" height={5} scrollOffset={20} />
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /line-21\b/);
  assert.doesNotMatch(frame, /line-1\b/);
});

it("clamps a controlled offset past the end", async () => {
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={lines(10)} format="text" height={5} scrollOffset={999} />
    </FancyTuiProvider>,
  );
  await settled();
  // 10 lines, 5 visible → the furthest first line is 6.
  assert.match(view.lastFrame() ?? "", /6–10 \/ 10/);
});

it("omits the indicator when everything already fits", async () => {
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={lines(3)} format="text" height={10} />
    </FancyTuiProvider>,
  );
  await settled();
  assert.doesNotMatch(view.lastFrame() ?? "", /\d+–\d+ \/ \d+/);
});

it("renders a registered extension's component in place", async () => {
  registerDocumentExtension({
    tag: "note",
    component: ({ content }) => <Text>[NOTE {content}]</Text>,
  });
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer id="doc" value={"top\n<note>hi</note>"} format="text" height={10} />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", /\[NOTE hi\]/);
  unregisterDocumentExtension("note");
});

it("lets an instance extension override a global one", async () => {
  registerDocumentExtension({ tag: "note", component: () => <Text>GLOBAL</Text> });
  const view = render(
    <FancyTuiProvider>
      <DocumentViewer
        id="doc"
        value="<note>x</note>"
        format="text"
        height={5}
        extensions={[{ tag: "note", component: () => <Text>LOCAL</Text> }]}
      />
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /LOCAL/);
  assert.doesNotMatch(frame, /GLOBAL/);
  unregisterDocumentExtension("note");
});
