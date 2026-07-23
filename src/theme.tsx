import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useStdout } from "ink";
import { MouseProvider, type MouseRegistry } from "./mouse.js";
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
  /**
   * Override the terminal size instead of reading it from stdout.
   *
   * Needed whenever the render target is not this process own terminal: a
   * server-side render for a browser terminal knows the client grid, and
   * stdout columns describes the wrong screen entirely. Also what lets a test
   * assert responsive behaviour without faking a TTY.
   */
  width?: number;
  height?: number;
  /**
   * Mouse / click support.
   *
   * - Omit for the default: an internal registry that decodes SGR mouse reports
   *   from stdin itself, so a standalone app gets clicks for free.
   * - Pass a registry from `createMouseRegistry()` when a HOST owns decoding and
   *   dispatch (an embedded terminal that reads mouse from its own transport);
   *   auto-decode is then off, and the host holds the reference to `dispatch`.
   * - Pass `false` to mount no mouse layer at all.
   */
  mouse?: MouseRegistry | false;
}

export function FancyTuiProvider({ children, theme = darkTheme, capabilities, width, height, mouse }: FancyTuiProviderProps) {
  const { stdout } = useStdout();
  const value = useMemo(() => ({
    theme,
    capabilities: { ...defaultCapabilities, ...capabilities },
    width: width ?? stdout?.columns ?? 80,
    height: height ?? stdout?.rows ?? 24,
  }), [theme, capabilities, width, height, stdout?.columns, stdout?.rows]);
  if (mouse === false) {
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  }
  return (
    <ThemeContext.Provider value={value}>
      <MouseProvider registry={mouse || undefined} autoDecode={mouse === undefined}>
        {children}
      </MouseProvider>
    </ThemeContext.Provider>
  );
}

export const useFancyTui = () => useContext(ThemeContext);
export const useTerminalSize = () => { const { width, height } = useFancyTui(); return { width, height }; };
