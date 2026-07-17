import { it } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "./render.js";

it("renders headings and fenced code as terminal output", () => {
  const value = renderMarkdown("# Hello\n\n```ts\nconst x = 1\n```");
  assert.match(value, /Hello/); assert.match(value, /const/); assert.doesNotMatch(value, /```ts/);
});
it("removes unsafe control characters", () => { assert.match(renderMarkdown("safe\u0000text"), /safetext/); });
