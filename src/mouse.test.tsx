import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { Text as InkText, measureElement } from "ink";
import { cleanup, render } from "ink-testing-library";
import { FancyTuiProvider } from "./theme.js";
import { Box } from "./layout.js";
import { Button } from "./inputs.js";
import { Clickable, MouseProvider, createMouseRegistry, decodeMouseSgr } from "./mouse.js";

afterEach(() => cleanup());

// `measureElement` returns zeros DURING render — layout has not run yet. Every
// hit-test below therefore waits for the post-render flush before dispatching,
// exactly as a real input handler would. Without this wait the tests would be
// dispatching against zero-size boxes and pass or fail for the wrong reason.
const settle = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); };

/** Center of a registered clickable's measured box, in root-relative coords. */
function center(registry: ReturnType<typeof createMouseRegistry>, index: number) {
  const node = registry.list()[index]!.ref.current!;
  const { x, y, width, height } = measureElement(node);
  return { x: x + Math.floor(width / 2), y: y + Math.floor(height / 2), width, height, left: x, top: y };
}

// ── decodeMouseSgr (pure) ────────────────────────────────────────────────────

it("decodes a left-button press and rejects everything else", () => {
  // 1-based SGR in, 0-based root-relative out.
  assert.deepEqual(decodeMouseSgr("[<0;12;5M"), { col: 11, row: 4, button: 0, press: true });
  // The ESC prefix is optional — Ink strips it before a handler sees it, a raw
  // stream keeps it.
  assert.deepEqual(decodeMouseSgr("\x1b[<0;3;2M"), { col: 2, row: 1, button: 0, press: true });
  // A left press with a keyboard modifier (shift = bit 2) still counts.
  assert.equal(decodeMouseSgr("[<4;1;1M")?.press, true);
  // A release is decoded but flagged not-a-press.
  assert.equal(decodeMouseSgr("[<0;12;5m")?.press, false);
  // Middle / right / wheel / motion are not clicks.
  assert.equal(decodeMouseSgr("[<1;1;1M"), null); // middle
  assert.equal(decodeMouseSgr("[<2;1;1M"), null); // right
  assert.equal(decodeMouseSgr("[<64;1;1M"), null); // wheel up
  assert.equal(decodeMouseSgr("[<32;1;1M"), null); // motion
  // A plain keystroke is not a mouse report.
  assert.equal(decodeMouseSgr("j"), null);
});

// ── the hit-test registry ────────────────────────────────────────────────────

it("fires the handler for a click inside a registered box", async () => {
  const registry = createMouseRegistry();
  let fired = 0;
  render(
    <MouseProvider registry={registry} autoDecode={false}>
      <Box flexDirection="column">
        <Clickable width={20} height={1} onClick={() => { fired += 1; }}><InkText>row A</InkText></Clickable>
      </Box>
    </MouseProvider>,
  );
  await settle();
  const a = center(registry, 0);
  const hit = registry.dispatch(a.x, a.y);
  assert.equal(hit, true);
  assert.equal(fired, 1);
});

it("does not fire for a click outside every registered box", async () => {
  const registry = createMouseRegistry();
  let fired = 0;
  render(
    <MouseProvider registry={registry} autoDecode={false}>
      <Box flexDirection="column">
        <Clickable width={20} height={1} onClick={() => { fired += 1; }}><InkText>row A</InkText></Clickable>
      </Box>
    </MouseProvider>,
  );
  await settle();
  const a = center(registry, 0);
  // One column past the right edge, and several rows below the single row.
  assert.equal(registry.dispatch(a.left + a.width, a.top), false);
  assert.equal(registry.dispatch(a.x, a.top + 5), false);
  assert.equal(fired, 0);
});

it("resolves a click in nested boxes to the innermost", async () => {
  const registry = createMouseRegistry();
  let outer = 0;
  let inner = 0;
  render(
    <MouseProvider registry={registry} autoDecode={false}>
      <Clickable width={30} height={5} onClick={() => { outer += 1; }}>
        <Clickable width={10} height={2} onClick={() => { inner += 1; }}><InkText>x</InkText></Clickable>
      </Clickable>
    </MouseProvider>,
  );
  await settle();
  // Identify the boxes by measured area, not registration order.
  const boxes = registry.list().map((c) => {
    const m = measureElement(c.ref.current!);
    return { m, area: m.width * m.height };
  });
  const innerBox = boxes.reduce((a, b) => (b.area < a.area ? b : a)).m;
  const outerBox = boxes.reduce((a, b) => (b.area > a.area ? b : a)).m;

  // A point inside the inner box (and therefore inside the outer) hits inner.
  registry.dispatch(innerBox.x + 1, innerBox.y + 1);
  assert.equal(inner, 1, "click in the inner box did not fire the inner handler");
  assert.equal(outer, 0, "click in the inner box wrongly fired the outer handler");

  // A point inside the outer box but below the inner one hits outer.
  registry.dispatch(outerBox.x + 1, outerBox.y + outerBox.height - 1);
  assert.equal(outer, 1, "click in the outer-only region did not fire the outer handler");
  assert.equal(inner, 1, "click in the outer-only region wrongly re-fired the inner handler");
});

it("skips a disabled clickable", async () => {
  const registry = createMouseRegistry();
  let fired = 0;
  render(
    <MouseProvider registry={registry} autoDecode={false}>
      <Clickable width={20} height={1} disabled onClick={() => { fired += 1; }}><InkText>no</InkText></Clickable>
    </MouseProvider>,
  );
  await settle();
  const a = center(registry, 0);
  assert.equal(registry.dispatch(a.x, a.y), false);
  assert.equal(fired, 0);
});

// ── auto-decode from stdin ───────────────────────────────────────────────────

it("auto-decodes an SGR mouse report arriving on stdin", async () => {
  const registry = createMouseRegistry();
  let fired = 0;
  const view = render(
    <MouseProvider registry={registry}>
      <Clickable width={20} height={1} onClick={() => { fired += 1; }}><InkText>hit me</InkText></Clickable>
    </MouseProvider>,
  );
  await settle();
  const a = center(registry, 0);
  // Feed a raw left-press at the box (SGR is 1-based, so +1 on each axis).
  view.stdin.write(`\x1b[<0;${a.x + 1};${a.y + 1}M`);
  await settle();
  assert.equal(fired, 1);
});

// ── through a real primitive ─────────────────────────────────────────────────

it("fires a Button's onPress when its box is clicked", async () => {
  const registry = createMouseRegistry();
  let pressed = 0;
  render(
    <FancyTuiProvider mouse={registry}>
      <Button id="go" onPress={() => { pressed += 1; }}>Go</Button>
    </FancyTuiProvider>,
  );
  await settle();
  const box = center(registry, 0);
  registry.dispatch(box.x, box.y);
  assert.equal(pressed, 1);
});

it("does not fire a disabled Button on click", async () => {
  const registry = createMouseRegistry();
  let pressed = 0;
  render(
    <FancyTuiProvider mouse={registry}>
      <Button id="go" disabled onPress={() => { pressed += 1; }}>Go</Button>
    </FancyTuiProvider>,
  );
  await settle();
  // A disabled Button still draws a box; dispatching into it must be a no-op.
  const entry = registry.list()[0];
  if (entry?.ref.current) {
    const { x, y } = measureElement(entry.ref.current);
    registry.dispatch(x, y);
  }
  assert.equal(pressed, 0);
});
