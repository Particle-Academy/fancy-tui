import type { ReactNode } from "react";

export type TuiTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "agent" | "user" | "tool";
export type TuiSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ActionPolicy = "observe" | "execute" | "propose" | "confirm" | "human-only";
export interface InteractiveProps { id: string; disabled?: boolean; }
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
