import { renderTerminalMarkdown } from "./terminal.js";

// C0 control codes we keep: TAB (9), LF (10), CR (13). Everything else in
// 0x00-0x1F, plus DEL (0x7F), is stripped from untrusted markdown before it
// reaches the terminal. Critically this includes ESC (27) — ESC begins every
// ANSI / OSC / CSI escape sequence, so leaving it in would let agent replies or
// tool output carry OSC52 clipboard writes, OSC8 hyperlink spoofs, and CSI
// buffer overwrites straight to the user's terminal. Expressed as a codepoint
// filter (not a regex character class) so the pattern carries no invisible
// control characters itself — the split-range class that predated this let ESC
// slip through exactly because the gap was easy to miss.
const KEEP_CONTROL = new Set([9, 10, 13]);

function stripControlChars(source: string): string {
  let out = "";
  for (const ch of source) {
    const cp = ch.codePointAt(0) ?? 0;
    const isControl = cp <= 0x1f || cp === 0x7f;
    if (!isControl || KEEP_CONTROL.has(cp)) {
      out += ch;
    }
  }
  return out;
}

/**
 * Render markdown as ANSI text for a terminal, wrapped at 80 columns.
 *
 * Colour follows chalk's detection of the environment (`FORCE_COLOR`, a TTY);
 * with colour off the output is plain text in the same layout.
 */
export function renderMarkdown(source: string): string {
  return renderTerminalMarkdown(stripControlChars(source));
}
