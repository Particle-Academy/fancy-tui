import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React, { type ReactNode } from "react";
import { Box, Text as InkText } from "ink";
import { cleanup, render } from "ink-testing-library";
import { FancyTuiProvider } from "./theme.js";
import { Card, Text } from "./layout.js";
import { Modal } from "./navigation.js";
import { Drawer, drawerRect, modalRect, type OverlayRect } from "./overlay.js";
import { TuiSurfaceProvider, createTuiSurfaceRegistry } from "./registry.js";

afterEach(() => cleanup());

const settled = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); };

/**
 * The background every overlay test is judged against.
 *
 * `@` never appears in a border, a label, or a fill — so a single `@` inside an
 * overlay's rectangle is the layout bleeding through, which is the entire
 * failure this component's fill layer exists to prevent.
 */
const BG = "@";
const ANSI = /\[[0-9;]*m/g;
const rowsOf = (frame: string) => frame.split("\n").map((line) => line.replace(ANSI, ""));

function Backdrop({ width, rows }: { width: number; rows: number }) {
  return <>{Array.from({ length: rows }, (_, i) => <InkText key={i}>{BG.repeat(width)}</InkText>)}</>;
}

/** The cells an overlay claims, as actually rendered. */
function regionOf(frame: string, rect: OverlayRect): string[] {
  return rowsOf(frame)
    .slice(rect.top, rect.top + rect.height)
    .map((line) => [...line].slice(rect.left, rect.left + rect.width).join(""));
}

/**
 * Recover the drawn box from the frame rather than trusting the geometry
 * helpers — a test that asks the implementation where it drew cannot catch the
 * implementation drawing in the wrong place.
 */
function renderedBox(frame: string): OverlayRect {
  const rows = rowsOf(frame);
  const top = rows.findIndex((line) => line.includes("╭"));
  const bottom = rows.findIndex((line) => line.includes("╰"));
  const chars = [...(rows[top] ?? "")];
  const left = chars.indexOf("╭");
  const right = chars.indexOf("╮");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * A 60x16 "terminal" whose every row is backdrop, inside a taller canvas.
 *
 * Full-height backdrop so an overlay always lands on something to bleed
 * through — a bottom drawer painted over blank rows would pass the opacity
 * assertion for free. The canvas is deliberately taller than the terminal so
 * inline and overlay renderings are distinguishable in ONE harness: an overlay
 * repaints backdrop rows, an inline panel appears below them, backdrop intact.
 */
const W = 60;
const H = 16;
const bounds = { width: W, height: H };

function harness(node: ReactNode, width = W, height = H) {
  return render(
    <FancyTuiProvider width={width} height={height}>
      <Box width={width} height={height + 8} flexDirection="column">
        <Backdrop width={width} rows={height} />
        {node}
      </Box>
    </FancyTuiProvider>,
  );
}

const intactBackdropRows = (frame: string, width = W) =>
  rowsOf(frame).filter((line) => line === BG.repeat(width)).length;

const rowOf = (frame: string, pattern: RegExp) => rowsOf(frame).findIndex((line) => pattern.test(line));

// ── Modal ───────────────────────────────────────────────────────────────────

it("renders a modal as a centered overlay by default", async () => {
  const view = harness(<Modal id="confirm" open title="Deploy to production?" onClose={() => {}} />);
  await settled();
  const frame = view.lastFrame() ?? "";
  const box = renderedBox(frame);
  assert.deepEqual(box, modalRect(bounds, "md"));
  assert.match(frame, /Deploy to production\?/);
  // It is an overlay, not a block: the backdrop rows it covers are broken.
  assert.ok(intactBackdropRows(frame) < H, "the modal did not paint over the layout");
});

it("paints an opaque modal — nothing bleeds through its padding", async () => {
  // Ink's padding cells write no character, so a bordered panel alone leaves
  // the layout showing through its own margins (`│unOVERLAY .│`). The fill
  // layer underneath is what makes this pass.
  const view = harness(<Modal id="confirm" open title="Deploy?" onClose={() => {}} />);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.ok(frame.includes(BG), "backdrop missing — the test would pass trivially");
  for (const [index, row] of regionOf(frame, modalRect(bounds, "md")).entries()) {
    assert.ok(!row.includes(BG), `layout bled through modal row ${index}: ${JSON.stringify(row)}`);
  }
});

it("renders a modal in flow when inline is set", async () => {
  const view = harness(<Modal id="confirm" open inline title="Deploy?" onClose={() => {}} />);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /Deploy\?/);
  assert.equal(intactBackdropRows(frame), H, "an inline modal must not paint over the layout");
  assert.ok(rowOf(frame, /Deploy\?/) >= H, "an inline modal must render below the content, not over it");
});

it("falls back to inline when the terminal is too small for an overlay", async () => {
  // 20x6 is under OVERLAY_MIN_WIDTH/HEIGHT: a bordered panel costs 2 columns
  // and 2 rows before it holds a character, so an overlay there is just noise.
  const view = harness(<Modal id="confirm" open title="Deploy?" onClose={() => {}} />, 20, 6);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.equal(intactBackdropRows(frame, 20), 6, "a too-small terminal must not get an overlay");
  assert.match(frame, /Deploy\?/);
});

it("keeps the modal size scale honest — sm is smaller than lg", async () => {
  const small = harness(<Modal id="a" open size="sm" title="S" onClose={() => {}} />);
  await settled();
  const smallBox = renderedBox(small.lastFrame() ?? "");
  cleanup();
  const large = harness(<Modal id="b" open size="lg" title="L" onClose={() => {}} />);
  await settled();
  const largeBox = renderedBox(large.lastFrame() ?? "");
  assert.ok(largeBox.width > smallBox.width, `lg ${largeBox.width} !> sm ${smallBox.width}`);
  assert.ok(largeBox.height > smallBox.height, `lg ${largeBox.height} !> sm ${smallBox.height}`);
});

it("renders Modal.Header, Modal.Body and Modal.Footer slots", async () => {
  const view = harness(
    <Modal id="confirm" open size="lg" closable={false} onClose={() => {}}>
      <Modal.Header>Deploy</Modal.Header>
      <Modal.Body><Text>2 pending approvals.</Text></Modal.Body>
      <Modal.Footer><Text>enter to confirm</Text></Modal.Footer>
    </Modal>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  for (const expected of [/Deploy/, /2 pending approvals\./, /enter to confirm/]) assert.match(frame, expected);
});

it("registers a modal surface an agent can read and close", async () => {
  const registry = createTuiSurfaceRegistry();
  let closed = 0;
  render(
    <FancyTuiProvider width={W} height={H}>
      <TuiSurfaceProvider registry={registry}>
        <Box width={W} height={H} flexDirection="column">
          <Modal id="confirm" open title="Deploy?" onClose={() => { closed += 1; }} />
        </Box>
      </TuiSurfaceProvider>
    </FancyTuiProvider>,
  );
  await settled();
  const surface = registry.get("confirm");
  assert.ok(surface, "Modal did not register a surface");
  assert.equal(surface.kind, "modal");
  assert.deepEqual(surface.read(), { open: true, title: "Deploy?", size: "md", mode: "overlay", bounds });
  const close = surface.commands?.find((command) => command.name === "close");
  assert.ok(close, "Modal surface has no close command");
  close.invoke();
  assert.equal(closed, 1);
});

// ── Drawer ──────────────────────────────────────────────────────────────────

it("anchors a drawer to each of the four sides", async () => {
  for (const side of ["left", "right", "top", "bottom"] as const) {
    const view = harness(<Drawer id={`d-${side}`} open side={side} title={side} onClose={() => {}} />);
    await settled();
    const frame = view.lastFrame() ?? "";
    assert.deepEqual(renderedBox(frame), drawerRect(bounds, side, "md"), `wrong box for side=${side}`);
    const expected = {
      left: { left: 0, top: 0 },
      right: { left: W - 24, top: 0 },
      top: { left: 0, top: 0 },
      bottom: { left: 0, top: H - 6 },
    }[side];
    const box = renderedBox(frame);
    assert.equal(box.left, expected.left, `side=${side} anchored at column ${box.left}`);
    assert.equal(box.top, expected.top, `side=${side} anchored at row ${box.top}`);
    cleanup();
  }
});

it("sizes a drawer along its own axis, filling the cross axis", async () => {
  // The subtle part of the API: `size` is width on left/right and height on
  // top/bottom. Swapping the two axes still renders a plausible-looking box,
  // so assert the axis each size actually moved.
  const boxFor = async (side: "right" | "bottom", size: "sm" | "lg") => {
    const view = harness(<Drawer id={`d-${side}-${size}`} open side={side} size={size} title="x" onClose={() => {}} />);
    await settled();
    const box = renderedBox(view.lastFrame() ?? "");
    cleanup();
    return box;
  };

  const rightSm = await boxFor("right", "sm");
  const rightLg = await boxFor("right", "lg");
  assert.equal(rightSm.height, H, "a side drawer must fill every row");
  assert.equal(rightLg.height, H, "a side drawer must fill every row");
  assert.ok(rightSm.width < W && rightLg.width < W, "a side drawer must not fill the width");
  assert.ok(rightLg.width > rightSm.width, `lg ${rightLg.width} !> sm ${rightSm.width} on the horizontal axis`);

  const bottomSm = await boxFor("bottom", "sm");
  const bottomLg = await boxFor("bottom", "lg");
  assert.equal(bottomSm.width, W, "a bottom drawer must fill every column");
  assert.equal(bottomLg.width, W, "a bottom drawer must fill every column");
  assert.ok(bottomSm.height < H && bottomLg.height < H, "a bottom drawer must not fill the height");
  assert.ok(bottomLg.height > bottomSm.height, `lg ${bottomLg.height} !> sm ${bottomSm.height} on the vertical axis`);
});

it("paints an opaque drawer on every side", async () => {
  for (const side of ["left", "right", "top", "bottom"] as const) {
    const view = harness(<Drawer id={`o-${side}`} open side={side} title={side} onClose={() => {}} />);
    await settled();
    const frame = view.lastFrame() ?? "";
    assert.ok(frame.includes(BG), "backdrop missing — the test would pass trivially");
    for (const [index, row] of regionOf(frame, drawerRect(bounds, side, "md")).entries()) {
      assert.ok(!row.includes(BG), `layout bled through ${side} drawer row ${index}: ${JSON.stringify(row)}`);
    }
    cleanup();
  }
});

it("attaches a drawer to a Card region via bounds", async () => {
  // A 40-column bordered Card gives its absolute children 38 columns and, at
  // height 10, eight rows — Yoga resolves them against the padding box, so the
  // border is excluded but the padding is not. The card is `elevated` (bold
  // border) purely so the round corners in the frame belong to the drawer.
  const view = render(
    <FancyTuiProvider width={80} height={24}>
      <Card variant="elevated" width={40} height={10}>
        <Backdrop width={36} rows={8} />
        <Drawer id="attached" open side="right" bounds={{ width: 38, height: 8 }} title="Filters" onClose={() => {}} />
      </Card>
    </FancyTuiProvider>,
  );
  await settled();
  const frame = view.lastFrame() ?? "";
  const box = renderedBox(frame);
  // Card border occupies column 0 and column 39; the drawer stays inside it.
  assert.equal(box.top, 1, "the drawer escaped the card vertically");
  assert.equal(box.left + box.width, 39, "the drawer is not flush with the card's inner right edge");
  assert.equal(box.height, 8, "the drawer did not fill the card's inner height");
  for (const [index, row] of regionOf(frame, box).entries()) {
    assert.ok(!row.includes(BG), `card content bled through drawer row ${index}: ${JSON.stringify(row)}`);
  }
});

it("renders a drawer in flow when inline is set", async () => {
  const view = harness(<Drawer id="d" open inline title="Filters" onClose={() => {}} />);
  await settled();
  const frame = view.lastFrame() ?? "";
  assert.match(frame, /Filters/);
  assert.equal(intactBackdropRows(frame), H, "an inline drawer must not paint over the layout");
});

it("registers a drawer surface an agent can read and close", async () => {
  const registry = createTuiSurfaceRegistry();
  let closed = 0;
  render(
    <FancyTuiProvider width={W} height={H}>
      <TuiSurfaceProvider registry={registry}>
        <Box width={W} height={H} flexDirection="column">
          <Drawer id="filters" open side="bottom" size="lg" title="Filters" onClose={() => { closed += 1; }} />
        </Box>
      </TuiSurfaceProvider>
    </FancyTuiProvider>,
  );
  await settled();
  const surface = registry.get("filters");
  assert.ok(surface, "Drawer did not register a surface");
  assert.equal(surface.kind, "drawer");
  assert.deepEqual(surface.read(), { open: true, side: "bottom", size: "lg", mode: "overlay", bounds });
  const close = surface.commands?.find((command) => command.name === "close");
  assert.ok(close, "Drawer surface has no close command");
  close.invoke();
  assert.equal(closed, 1);
});

it("closes a drawer and a modal on escape", async () => {
  let closed = 0;
  const view = harness(
    <>
      <Modal id="m" open title="Deploy?" onClose={() => { closed += 1; }} />
      <Drawer id="d" open title="Filters" onClose={() => { closed += 1; }} />
    </>,
  );
  await settled();
  view.stdin.write("");
  await settled();
  assert.equal(closed, 2);
});
