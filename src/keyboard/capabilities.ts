import type { TerminalCapabilities } from "../types.js";

export function detectKeyboardCapabilities(env: NodeJS.ProcessEnv = process.env, isTTY = Boolean(process.stdin.isTTY)): TerminalCapabilities {
  const term = (env.TERM ?? "").toLowerCase();
  const program = (env.TERM_PROGRAM ?? "").toLowerCase();
  const color = env.COLORTERM?.toLowerCase().includes("truecolor") ? "truecolor"
    : /256color/.test(term) ? "ansi256" : term === "dumb" || !isTTY ? "none" : "ansi16";
  const enhancedKeyboard = isTTY && (Boolean(env.KITTY_WINDOW_ID) || /wezterm|ghostty|iterm/.test(program));
  return {
    color,
    unicode: env.LANG !== "C" && env.LC_ALL !== "C",
    enhancedKeyboard,
    shiftEnter: enhancedKeyboard,
    hyperlinks: isTTY && /wezterm|ghostty|iterm|vscode/.test(program),
  };
}

/** Enable Kitty progressive keyboard enhancement; caller must invoke restore. */
export function enableEnhancedKeyboard(stream: NodeJS.WriteStream = process.stdout): () => void {
  if (!stream.isTTY) return () => undefined;
  stream.write("\u001B[>1u");
  let restored = false;
  return () => { if (!restored) { restored = true; stream.write("\u001B[<u"); } };
}
