import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useStdout } from "ink";
import type { TerminalCapabilities, TuiTheme } from "./types.js";

export const darkTheme: TuiTheme = {
  mode: "dark",
  colors: {
    neutral: "gray", primary: "cyan", success: "green", warning: "yellow", danger: "red",
    info: "blue", agent: "magenta", user: "cyan", tool: "yellow", text: "white", muted: "gray",
    border: "gray", focus: "cyan", background: "black",
  },
  spacing: { xs: 0, sm: 1, md: 1, lg: 2, xl: 3 },
  borders: { panel: "round", focus: "double" },
  glyphs: { success: "✓", failure: "✗", warning: "!", pending: "…", bullet: "•", cursor: "▌" },
};

const defaultCapabilities: TerminalCapabilities = {
  color: "truecolor", unicode: true, enhancedKeyboard: false, shiftEnter: false, hyperlinks: false,
};

interface ThemeContextValue { theme: TuiTheme; capabilities: TerminalCapabilities; width: number; height: number; }
const ThemeContext = createContext<ThemeContextValue>({ theme: darkTheme, capabilities: defaultCapabilities, width: 80, height: 24 });

export interface FancyTuiProviderProps {
  children: ReactNode;
  theme?: TuiTheme;
  capabilities?: Partial<TerminalCapabilities>;
}

export function FancyTuiProvider({ children, theme = darkTheme, capabilities }: FancyTuiProviderProps) {
  const { stdout } = useStdout();
  const value = useMemo(() => ({
    theme,
    capabilities: { ...defaultCapabilities, ...capabilities },
    width: stdout?.columns ?? 80,
    height: stdout?.rows ?? 24,
  }), [theme, capabilities, stdout?.columns, stdout?.rows]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useFancyTui = () => useContext(ThemeContext);
export const useTerminalSize = () => { const { width, height } = useFancyTui(); return { width, height }; };
