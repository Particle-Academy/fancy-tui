import { it } from "node:test";
import assert from "node:assert/strict";
import { detectKeyboardCapabilities } from "./capabilities.js";

it("only advertises shift-enter for enhanced terminals", () => {
  assert.deepEqual(detectKeyboardCapabilities({ TERM: "xterm-256color", TERM_PROGRAM: "WezTerm" }, true), { color: "ansi256", enhancedKeyboard: true, shiftEnter: true, unicode: true, hyperlinks: true });
  assert.equal(detectKeyboardCapabilities({ TERM: "xterm" }, true).shiftEnter, false);
});
