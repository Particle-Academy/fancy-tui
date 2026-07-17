import { it } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "./render.js";

// Control chars are built with String.fromCharCode so this test file carries no
// invisible bytes of its own.
const NUL = String.fromCharCode(0);
const BEL = String.fromCharCode(7);
const ESC = String.fromCharCode(27);

it("renders headings and fenced code as terminal output", () => {
  const value = renderMarkdown("# Hello\n\n```ts\nconst x = 1\n```");
  assert.match(value, /Hello/); assert.match(value, /const/); assert.doesNotMatch(value, /```ts/);
});

it("removes unsafe control characters", () => {
  assert.match(renderMarkdown(`safe${NUL}text`), /safetext/);
});

it("strips ESC so ANSI/CSI sequences cannot reach the terminal", () => {
  const out = renderMarkdown(`safe${ESC}[31mred${ESC}[0m`);
  assert.ok(!out.includes(ESC), "ESC must be stripped from rendered output");
});

it("strips ESC-led OSC sequences (clipboard / title injection)", () => {
  const osc52 = renderMarkdown(`x${ESC}]52;c;cGF5bG9hZA==${BEL}`);
  assert.ok(!osc52.includes(ESC), "OSC introducer ESC must be stripped");
  const inFence = renderMarkdown(`\`\`\`\n${ESC}]0;pwned${BEL}\n\`\`\``);
  assert.ok(!inFence.includes(ESC), "ESC must be stripped inside fenced code too");
});
