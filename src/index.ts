export * from "./types.js";
export * from "./theme.js";
export * from "./registry.js";
export * from "./layout.js";
export * from "./display.js";
export * from "./inputs.js";
export * from "./navigation.js";
export * from "./data.js";
export * from "./content.js";
export * from "./keyboard/index.js";
export * from "./markdown/index.js";

/**
 * Ink's focus manager, re-exported so programmatic focus is reachable without
 * a direct `ink` import.
 *
 * Components auto-focus by default (see `InteractiveProps.autoFocus`), and
 * Ink's manager is first-come — so moving focus later (opening a modal,
 * switching panes) needs an explicit `focus(id)` call:
 *
 * ```tsx
 * const { focus } = useFocusManager();
 * useEffect(() => { focus("prompt"); }, [focus]);
 * ```
 */
export { useFocusManager } from "ink";
