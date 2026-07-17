import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTextBuffer, reduceTextBuffer } from "./buffer.js";

describe("text buffer", () => {
  it("inserts and removes grapheme clusters", () => {
    let state = createTextBuffer("A👨‍👩‍👧‍👦B");
    state = reduceTextBuffer(state, { type: "left" });
    state = reduceTextBuffer(state, { type: "backspace" });
    assert.equal(state.value, "AB");
  });
  it("moves vertically while preserving the desired column", () => {
    const state = reduceTextBuffer({ value: "one\ntwenty\nend", cursor: { offset: 7 } }, { type: "down" });
    assert.equal(state.cursor.offset, 14);
  });
  it("replaces a selection", () => {
    const state = reduceTextBuffer({ value: "hello world", cursor: { offset: 11 }, selection: { start: 6, end: 11 } }, { type: "insert", text: "Ink" });
    assert.deepEqual(state, { value: "hello Ink", cursor: { offset: 9 } });
  });
});
