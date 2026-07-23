import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { Box as InkBox, Text as InkText, measureElement, useInput, type BoxProps as InkBoxProps, type DOMElement } from "ink";

/**
 * Mouse / click support — the pointer sibling of the keyboard layer.
 *
 * ## Why this is a hit-test registry, not a DOM
 *
 * A terminal has no elements to attach a listener to: the "UI" is a grid of
 * cells, and a mouse report is a pair of coordinates. So click support is a
 * registry of clickable BOXES plus a hit test. A component that wants to be
 * clickable hands the registry a ref to the Ink `<Box>` it draws into and an
 * `onClick`; the registry measures every registered box (via Ink's
 * `measureElement`) and fires the smallest one that contains the click.
 *
 * ## Coordinates
 *
 * `measureElement` returns a box's position **relative to the Ink root**, walking
 * up the layout tree accumulating each ancestor's offset — NOT relative to any
 * nested provider. So a click's coordinates must be in that same root-relative,
 * 0-based space. `decodeMouseSgr` converts a terminal's 1-based SGR report into
 * it. When the app claims the whole terminal (`<Box height={rows}>` at the top),
 * root-relative equals viewport-relative and no further translation is needed.
 *
 * `measureElement` returns zeros DURING render (before layout runs), so a
 * dispatch must happen from post-render code — an input handler, an effect, or a
 * timer. `MouseProvider`'s own decoder satisfies this (it runs from `useInput`);
 * a host driving `dispatch` directly must call it from the same kind of place.
 *
 * ## Additive and keyboard-neutral
 *
 * Nothing here changes how a component renders or how it reads the keyboard. A
 * component with no `useClickable` is simply not clickable; a tree with no
 * `MouseProvider` registers nothing and every hook no-ops. `FancyTuiProvider`
 * mounts a `MouseProvider` by default, so an app gets clicks for free once its
 * terminal is reporting them.
 */

/** One registered clickable region: the box to hit-test and what to do. */
export interface Clickable {
  /** Ref to the Ink `<Box>` whose measured rectangle is the click target. */
  ref: RefObject<DOMElement | null>;
  /** Fired when a click lands inside the box and it is the innermost hit. */
  invoke: () => void;
  /** Read live so a disabled region is skipped without re-registering. */
  isDisabled: () => boolean;
}

export interface MouseRegistry {
  /** Register a clickable; returns an unregister function. */
  register(clickable: Clickable): () => void;
  /**
   * Fire the handler of the innermost registered box containing `(col, row)`,
   * in 0-based root-relative coordinates. Returns whether anything was hit.
   *
   * "Innermost" = smallest area, so a click on a button inside a card resolves
   * to the button, never the card.
   */
  dispatch(col: number, row: number): boolean;
  /** Registered clickables — for tests and diagnostics. */
  list(): Clickable[];
}

export function createMouseRegistry(): MouseRegistry {
  const clickables = new Set<Clickable>();
  return {
    register(clickable) {
      clickables.add(clickable);
      return () => {
        clickables.delete(clickable);
      };
    },
    list: () => [...clickables],
    dispatch(col, row) {
      let best: Clickable | null = null;
      let bestArea = Infinity;
      for (const clickable of clickables) {
        const node = clickable.ref.current;
        if (!node || clickable.isDisabled()) continue;
        const { x, y, width, height } = measureElement(node);
        // Zero-size means unmeasured (called during render) or an empty box —
        // never a hit target.
        if (width <= 0 || height <= 0) continue;
        if (col < x || col >= x + width || row < y || row >= y + height) continue;
        const area = width * height;
        // Strictly smaller wins, so the innermost of nested boxes is chosen.
        if (area < bestArea) {
          best = clickable;
          bestArea = area;
        }
      }
      if (!best) return false;
      best.invoke();
      return true;
    },
  };
}

/** A decoded left-button mouse event, in 0-based root-relative coordinates. */
export interface MouseClick {
  col: number;
  row: number;
  /** Raw SGR button byte (low bits + modifier + wheel/motion flags). */
  button: number;
  /** `true` for a button press (`M`), `false` for a release (`m`). */
  press: boolean;
}

/**
 * The SGR mouse report, `ESC [ < button ; col ; row (M|m)`.
 *
 * Ink strips the leading ESC before an input handler sees the sequence, so the
 * ESC is optional here — this parses both `\x1b[<0;5;3M` (raw) and `[<0;5;3M`
 * (what `useInput` delivers).
 */
const SGR_MOUSE = /^\x1b?\[<(\d+);(\d+);(\d+)([Mm])$/;

/**
 * Decode an SGR mouse report into a left-button click, or `null`.
 *
 * Only a LEFT button event (with any keyboard modifier) is a click. Wheel
 * (bit 6) and motion/drag (bit 5) reports, and the middle/right buttons, are
 * rejected — a docs surface forwards none of them. The 1-based terminal
 * coordinates are converted to the 0-based space `measureElement` uses.
 */
export function decodeMouseSgr(input: string): MouseClick | null {
  const match = SGR_MOUSE.exec(input);
  if (!match) return null;
  const button = Number(match[1]);
  // Reject wheel (64), motion (32), and the middle/right buttons (low 2 bits).
  if ((button & 0b1100011) !== 0) return null;
  return {
    col: Number(match[2]) - 1,
    row: Number(match[3]) - 1,
    button,
    press: match[4] === "M",
  };
}

const MouseContext = createContext<MouseRegistry | null>(null);

/** The nearest mouse registry, or `null` outside a `MouseProvider`. */
export const useMouseRegistry = () => useContext(MouseContext);

/**
 * Make a component clickable: register `ref`'s box so a click inside it calls
 * `onClick`. No-ops outside a `MouseProvider`. `onClick` and `disabled` are read
 * live, so a re-render never churns the registration.
 */
export function useClickable(
  ref: RefObject<DOMElement | null>,
  onClick: () => void,
  options?: { disabled?: boolean },
): void {
  const registry = useMouseRegistry();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const disabledRef = useRef(options?.disabled ?? false);
  disabledRef.current = options?.disabled ?? false;
  useEffect(() => {
    if (!registry) return;
    return registry.register({
      ref,
      invoke: () => onClickRef.current(),
      isDisabled: () => disabledRef.current,
    });
  }, [registry, ref]);
}

export interface ClickableProps extends Omit<InkBoxProps, "children"> {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * A `<Box>` that fires `onClick` when clicked. The ergonomic wrapper for the
 * common case — a list row, a footer hint, a menu item — where the clickable
 * region is a box you would draw anyway.
 */
export function Clickable({ onClick, disabled, children, ...box }: ClickableProps) {
  const ref = useRef<DOMElement | null>(null);
  useClickable(ref, onClick, { disabled });
  // A bare string dropped straight into an Ink Box blanks the whole subtree;
  // wrap primitives so `<Clickable>label</Clickable>` is safe.
  const safe = typeof children === "string" || typeof children === "number" ? <InkText>{children}</InkText> : children;
  return (
    <InkBox ref={ref} {...box}>
      {safe}
    </InkBox>
  );
}

/** Decodes SGR mouse reports from stdin and dispatches them. Renders nothing. */
function MouseDecoder({ registry }: { registry: MouseRegistry }) {
  useInput((input) => {
    const click = decodeMouseSgr(input);
    if (click?.press) registry.dispatch(click.col, click.row);
  });
  return null;
}

export interface MouseProviderProps {
  children: ReactNode;
  /**
   * The registry to publish. Omit to create one internally. Pass a shared
   * registry (from `createMouseRegistry()`) when a HOST wants to drive
   * `dispatch` itself — e.g. an embedded terminal that decodes mouse reports
   * from its own transport and hit-tests the app's chrome first.
   */
  registry?: MouseRegistry;
  /**
   * Decode SGR mouse reports arriving on stdin and dispatch them. Default on —
   * a standalone app gets clicks for free. Turn OFF when a host owns decoding
   * (it would otherwise double-fire).
   */
  autoDecode?: boolean;
}

/**
 * Provides a mouse registry to the tree and, by default, decodes SGR mouse
 * reports from stdin into clicks. Mounted automatically by `FancyTuiProvider`.
 */
export function MouseProvider({ children, registry, autoDecode = true }: MouseProviderProps) {
  const owned = useMemo(() => registry ?? createMouseRegistry(), [registry]);
  return (
    <MouseContext.Provider value={owned}>
      {autoDecode ? <MouseDecoder registry={owned} /> : null}
      {children}
    </MouseContext.Provider>
  );
}
