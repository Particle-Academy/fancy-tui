import type { ReactNode } from "react";

export type TuiTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "agent" | "user" | "tool";
export type TuiSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ActionPolicy = "observe" | "execute" | "propose" | "confirm" | "human-only";
export interface InteractiveProps {
  id: string;
  disabled?: boolean;
  /**
   * Claim keyboard focus on mount. Default `true`.
   *
   * Ink's own `useFocus` defaults this to `false`, which means nothing in a
   * terminal app is focused until the user presses Tab — an undiscoverable
   * step that silently swallows every keystroke until then. A TUI toolkit
   * whose first example is a prompt should have that prompt ready to type
   * into, so we invert the default.
   *
   * Ink's focus manager is first-come: the earliest mounted focusable claims
   * focus and later ones do NOT steal it, so leaving this on everywhere is
   * safe. Pass `false` to keep a component out of the initial claim.
   */
  autoFocus?: boolean;
}
export interface Option { id: string; label: string; description?: string; disabled?: boolean; }
export interface BaseProps { children?: ReactNode; }

export interface TerminalCapabilities {
  color: "none" | "ansi16" | "ansi256" | "truecolor";
  unicode: boolean;
  enhancedKeyboard: boolean;
  shiftEnter: boolean;
  hyperlinks: boolean;
}

export interface TuiTheme {
  mode: "dark" | "light";
  colors: Record<TuiTone | "text" | "muted" | "border" | "focus" | "background", string>;
  spacing: Record<TuiSize, number>;
  borders: { panel: "single" | "double" | "round" | "bold"; focus: "single" | "double" | "round" | "bold" };
  glyphs: { success: string; failure: string; warning: string; pending: string; bullet: string; cursor: string };
}
