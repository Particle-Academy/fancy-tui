import { afterEach, it } from "node:test";
import assert from "node:assert/strict";
import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import stringWidth from "string-width";
import { cleanup, render } from "./render-harness.js";

/**
 * The harness every Ink test in this package runs on, pinned by what those
 * tests rely on. It replaced ink-testing-library; this file passed unchanged
 * against both, which is what "the same behaviour" means here.
 */

afterEach(() => cleanup());

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const SGR = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, "g");

function Ticker({ onTick }: { onTick: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      onTick();
      setN((x) => x + 1);
    }, 5);
    return () => clearInterval(timer);
  }, [onTick]);
  return <Text>tick {n}</Text>;
}

it("captures the rendered frame", () => {
  const view = render(<Text>hello harness</Text>);
  assert.equal(view.lastFrame(), "hello harness");
  assert.deepEqual(view.frames, ["hello harness"]);
});

it("rerenders into a new frame and keeps the history", () => {
  const view = render(<Text>first</Text>);
  view.rerender(<Text>second</Text>);
  assert.equal(view.lastFrame(), "second");
  assert.equal(view.frames[0], "first");
  assert.equal(view.frames.at(-1), "second");
});

it("lays out to 100 columns", () => {
  const view = render(<Box borderStyle="single" width="100%"><Text>x</Text></Box>);
  const top = (view.lastFrame() ?? "").replace(SGR, "").split("\n")[0]!;
  assert.equal(stringWidth(top), 100);
});

it("delivers stdin writes to useInput, as a raw-mode TTY", async () => {
  function Echo() {
    const [keys, setKeys] = useState("");
    useInput((input) => setKeys((k) => k + input));
    return <Text>keys:{keys}</Text>;
  }
  const view = render(<Echo />);
  await settle();
  view.stdin.write("a");
  await settle();
  view.stdin.write("b");
  await settle();
  assert.equal(view.lastFrame(), "keys:ab");
  assert.equal(view.stdin.isTTY, true);
});

it("stops rendering after unmount", async () => {
  let ticks = 0;
  const view = render(<Ticker onTick={() => { ticks += 1; }} />);
  await settle();
  assert.ok(ticks > 0);
  view.unmount();
  const after = ticks;
  await settle();
  assert.equal(ticks, after, "effects kept running after unmount");
});

it("cleanup() unmounts every tree rendered so far", async () => {
  let ticks = 0;
  const onTick = () => { ticks += 1; };
  render(<Ticker onTick={onTick} />);
  render(<Ticker onTick={onTick} />);
  await settle();
  assert.ok(ticks > 0);
  cleanup();
  const after = ticks;
  await settle();
  assert.equal(ticks, after, "a tree survived cleanup()");
});

it("keeps stderr apart from stdout", () => {
  const view = render(<Text>out</Text>);
  assert.deepEqual(view.stderr.frames, []);
  assert.equal(view.stdout.lastFrame(), "out");
});
