import { it } from "node:test";
import assert from "node:assert/strict";
import { createTuiSurfaceRegistry } from "./registry.js";

it("rejects duplicate stable handles and notifies subscribers", () => {
  const registry = createTuiSurfaceRegistry(); let calls = 0; registry.subscribe(() => calls++);
  const dispose = registry.register({ id: "send", kind: "button", read: () => ({}) });
  assert.throws(() => registry.register({ id: "send", kind: "button", read: () => ({}) }), /Duplicate/);
  dispose(); assert.deepEqual(registry.list(), []); assert.equal(calls, 2);
});
