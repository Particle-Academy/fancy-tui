import { useEffect, useMemo, type ReactNode } from "react";
import { FancyTuiProvider, type FancyTuiProviderProps } from "../theme.js";
import { detectKeyboardCapabilities, enableEnhancedKeyboard } from "./capabilities.js";

export function useKeyboardCapabilities() { return useMemo(() => detectKeyboardCapabilities(), []); }
export interface KeyboardProtocolProviderProps extends Omit<FancyTuiProviderProps, "capabilities"> { children: ReactNode; autoEnable?: boolean; }
export function KeyboardProtocolProvider({ children, autoEnable = true, ...props }: KeyboardProtocolProviderProps) {
  const capabilities = useKeyboardCapabilities();
  useEffect(() => autoEnable && capabilities.enhancedKeyboard ? enableEnhancedKeyboard() : undefined, [autoEnable, capabilities.enhancedKeyboard]);
  return <FancyTuiProvider {...props} capabilities={capabilities}>{children}</FancyTuiProvider>;
}
