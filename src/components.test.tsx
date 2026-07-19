import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { FancyTuiProvider } from "./theme.js";
import { Panel, Responsive, Text } from "./layout.js";
import { MessageList, LiveRegion } from "./content.js";
import { Input, MultilineInput } from "./inputs.js";

afterEach(() => cleanup());

it("renders the dark panel language and responsive content", () => {
  const view = render(<FancyTuiProvider><Panel title="Agent"><Responsive below={80} fallback={<Text>narrow</Text>}><Text>wide</Text></Responsive></Panel></FancyTuiProvider>);
  const frame = view.lastFrame() ?? ""; assert.match(frame, /Agent/); assert.match(frame, /wide/); assert.doesNotMatch(frame, /narrow/);
});

it("keeps committed messages separate from the changing live region", () => {
  const committed = [{ id: "m1", role: "user" as const, content: "hello" }];
  const tree = (status: string) => <FancyTuiProvider><MessageList messages={committed} /><LiveRegion><Text>{status}</Text></LiveRegion></FancyTuiProvider>;
  const view = render(tree("thinking…")); view.rerender(tree("running tool…"));
  const frame = view.lastFrame() ?? ""; assert.match(frame, /hello/); assert.match(frame, /running tool/);
});

// ── Focus affordances (#1, #2) ──────────────────────────────────────────────
//
// Ink registers focusables from an effect and repaints on the next tick, so the
// FIRST frame is always unfocused. Every assertion below waits for that flush —
// without it the negative tests would pass trivially against the initial frame
// rather than proving focus is never claimed.

const settled = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); };
const FOCUSED_BORDER = /[╔╗║╚╝]/;

it("focuses the composer on mount so the first keystroke is not swallowed (#1)", async () => {
  // Ink's useFocus defaults autoFocus to false, so before this fix nothing was
  // focused until the user pressed Tab — an undiscoverable step that silently
  // dropped every keystroke, including in the README's own example.
  const view = render(
    <FancyTuiProvider>
      <MultilineInput id="prompt" value="" onChange={() => {}} placeholder="type here" />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", FOCUSED_BORDER);
});

it("does not claim focus when autoFocus is off", async () => {
  const view = render(
    <FancyTuiProvider>
      <MultilineInput id="prompt" value="" onChange={() => {}} placeholder="type here" autoFocus={false} />
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.doesNotMatch(frame, FOCUSED_BORDER);
  assert.doesNotMatch(frame, /▌/);
  assert.match(frame, /type here/);
});

it("shows a cursor in a focused EMPTY composer (#2)", async () => {
  // The empty branch used to short-circuit to the placeholder and skip the
  // cursor, so a focused empty composer looked identical to an unfocused one.
  const view = render(
    <FancyTuiProvider>
      <MultilineInput id="prompt" value="" onChange={() => {}} placeholder="type here" />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", /▌type here/);
});

it("shows a cursor in a focused empty single-line Input (#2)", async () => {
  const view = render(
    <FancyTuiProvider>
      <Input id="q" value="" onChange={() => {}} placeholder="search" />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", /▌search/);
});

it("keeps the cursor inline at the offset once text exists", async () => {
  const view = render(
    <FancyTuiProvider>
      <MultilineInput id="prompt" value="abcd" onChange={() => {}} cursor={{ offset: 2 }} />
    </FancyTuiProvider>,
  );
  await settled();
  assert.match(view.lastFrame() ?? "", /ab▌cd/);
});

it("lets the first mounted focusable win rather than stealing focus", async () => {
  // Ink's manager is first-come, so defaulting autoFocus on everywhere is safe:
  // a later sibling must not yank focus away from the first.
  const view = render(
    <FancyTuiProvider>
      <Input id="first" value="" onChange={() => {}} placeholder="alpha" />
      <Input id="second" value="" onChange={() => {}} placeholder="bravo" />
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.equal((frame.match(/▌/g) ?? []).length, 1);
  assert.match(frame, /▌alpha/);
});
