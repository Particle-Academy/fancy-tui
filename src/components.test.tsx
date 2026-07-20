import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import stringWidth from "string-width";
import { FancyTuiProvider } from "./theme.js";
import { Header, Hero, Panel, Responsive, Row, Screen, Stack, StatusBar, Text } from "./layout.js";
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

// ── Plain strings in ReactNode slots ────────────────────────────────────────
//
// Ink discards raw text placed directly inside a Box — and not just the text:
// the entire subtree renders empty, with nothing on stderr. So `status="ok"`
// (the obvious call) silently produced a blank frame while `status={<Text/>}`
// worked. Every ReactNode slot now routes through tuiNode().

it("renders a Header whose status is a plain string", async () => {
  const view = render(<FancyTuiProvider><Header title="Fancy TUI" status="connected" /></FancyTuiProvider>);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /Fancy TUI/);
  assert.match(frame, /connected/);
});

it("renders a StatusBar built entirely from strings", async () => {
  const view = render(<FancyTuiProvider><StatusBar left="3 workers" center="main" right="Ctrl+R refresh" /></FancyTuiProvider>);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /3 workers/);
  assert.match(frame, /main/);
  assert.match(frame, /Ctrl\+R refresh/);
});

it("renders string children inside Stack, Row, Panel, and Screen", async () => {
  const view = render(
    <FancyTuiProvider>
      <Screen>
        <Stack>stack text</Stack>
        <Row>row text</Row>
        <Panel title="Run">panel text</Panel>
      </Screen>
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  for (const expected of [/stack text/, /row text/, /panel text/]) {
    assert.match(frame, expected);
  }
});

it("still renders element children unchanged", async () => {
  const view = render(<FancyTuiProvider><Header title="T" status={<Text>wrapped</Text>} /></FancyTuiProvider>);
  await settled();
  assert.match(view.lastFrame() ?? "", /wrapped/);
});

it("renders mixed string and element children", async () => {
  const view = render(<FancyTuiProvider><Row>{"plain "}<Text>element</Text></Row></FancyTuiProvider>);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /plain/);
  assert.match(frame, /element/);
});

// ── Hero (#startup screen) ──────────────────────────────────────────────────
//
// The point of shipping this rather than letting every app draw its own: hand
// counted terminal art does not survive a content change. These assert the box
// is derived from the content, not assumed.

it("renders a hero with mark, title, version, tagline and hints", () => {
  const view = render(
    <FancyTuiProvider>
      <Hero
        title="Fancy Docs"
        version="v0.4.0"
        tagline="Browse the registry from your terminal"
        mark={["┌─┐", "└─┘"]}
        hints={[{ keys: "/", label: "search" }, { keys: "?", label: "help" }]}
      />
    </FancyTuiProvider>,
  );
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /Fancy Docs/);
  assert.match(frame, /v0\.4\.0/);
  assert.match(frame, /Browse the registry/);
  assert.match(frame, /search/);
  assert.match(frame, /help/);
});

it("keeps every hero line the same width when the mark changes width", () => {
  // The regression this component exists to prevent: a box whose borders were
  // counted by hand against one piece of art, then reused with another.
  const frameFor = (mark: string[]) => {
    const view = render(
      <FancyTuiProvider><Hero title="T" mark={mark} /></FancyTuiProvider>,
    );
    const frame = view.lastFrame() ?? "";
    cleanup();
    return frame;
  };

  for (const mark of [["#"], ["####################"], ["a", "bbbbbbbbbbbbbbbb"]]) {
    const lines = frameFor(mark).split("\n").filter((l) => l.length > 0);
    const widths = new Set(lines.map((l) => stringWidth(l)));
    assert.equal(widths.size, 1, `ragged hero for mark ${JSON.stringify(mark)}: widths ${[...widths].join()}`);
  }
});

it("drops the mark and the border on a narrow terminal", () => {
  // A box drawn around content already at the terminal's edge costs two
  // columns it does not have.
  const view = render(
    <FancyTuiProvider width={30}>
      <Hero title="Fancy" mark={["BIGMARK"]} compactBelow={48} />
    </FancyTuiProvider>,
  );
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /Fancy/);
  assert.doesNotMatch(frame, /BIGMARK/);
  assert.doesNotMatch(frame, /[─│┌┐└┘╭╮╰╯]/);
});

it("swaps in the ascii mark when the terminal cannot draw unicode", () => {
  const view = render(
    <FancyTuiProvider capabilities={{ unicode: false }}>
      <Hero title="Fancy" mark={["◆◆◆"]} asciiMark={["***"]} />
    </FancyTuiProvider>,
  );
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /\*\*\*/);
  assert.doesNotMatch(frame, /◆/);
});
