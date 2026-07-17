import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { FancyTuiProvider } from "./theme.js";
import { Panel, Responsive, Text } from "./layout.js";
import { MessageList, LiveRegion } from "./content.js";

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
