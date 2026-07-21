import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Box as InkBox, Text as InkText, useInput } from "ink";
import { KeyHint, Panel, Row, Spacer, tuiBoldNode, tuiNode } from "./layout.js";
import { useTuiSurface } from "./registry.js";
import { useFancyTui, useTerminalSize } from "./theme.js";
import type { InteractiveProps, TuiTone } from "./types.js";

/**
 * Overlay surfaces — the machinery `Modal` and `Drawer` share.
 *
 * ## Why an overlay in a terminal needs a fill layer
 *
 * Ink paints later siblings OVER earlier ones, so an absolutely-positioned box
 * rendered last lands on top of the layout. That is only half an overlay:
 * border characters and text overwrite what is beneath them, but a Box's
 * `paddingX` / `paddingY` cells write NOTHING. The layout underneath shows
 * straight through the padding — a panel over the word "runner" renders as
 * `│unOVERLAY .│`, with `un` and `.` bleeding in from behind.
 *
 * So every overlay paints a rectangle of spaces at the same coordinates FIRST,
 * then the panel on top of it. Spaces rather than `backgroundColor` because a
 * filled background commits the overlay to one terminal theme; spaces stay
 * neutral against any of them. A TUI cannot dim a scrim — there is no
 * compositing, only overwriting — so "backdrop" here means opaque, nothing more.
 *
 * The fill needs an exact cell count, which is why every dimension here is
 * computed NUMERICALLY from `bounds` rather than expressed as a percentage.
 *
 * ## Overlays only paint on rows the layout already owns
 *
 * Ink sizes its output canvas from IN-FLOW layout. An absolute box that would
 * draw past the bottom of that canvas is silently dropped — an overlay in an
 * app whose root is one line tall renders nothing at all. Give the app root a
 * height (`<Screen fullHeight>`, or a `Box height={rows}`) before expecting a
 * centered overlay, or pass `inline` and let it render in flow.
 */

/** How large an overlay is. For `Drawer` this addresses its own axis. */
export type OverlaySize = "sm" | "md" | "lg" | "xl" | "full";

/** Which edge a drawer is anchored to. */
export type DrawerSide = "left" | "right" | "top" | "bottom";

/**
 * The region an overlay is positioned inside, in terminal cells.
 *
 * Defaults to the terminal size. Pass it to attach an overlay to something
 * smaller — a Card, a layout pane, the shell around a prompt input — since an
 * absolutely-positioned Ink box resolves against its parent, so "attaching" is
 * mostly a matter of where you render it. The dimensions still have to be
 * explicit: the fill layer is a literal count of space characters, and wrong
 * bounds produce a fill that is too small (the layout bleeds through the gap)
 * or too large (it paints over content outside the region).
 *
 * Measure the region INSIDE its border: a bordered Card of width 40 gives its
 * absolute children 38 columns, because Yoga positions them against the
 * padding box.
 */
export interface OverlayBounds { width: number; height: number }

/** A resolved overlay rectangle, relative to the top-left of its bounds. */
export interface OverlayRect { left: number; top: number; width: number; height: number }

const clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), Math.min(min, max));

/**
 * Below this the terminal (or the attached region) is too small for an overlay
 * to mean anything: a bordered panel costs 2 columns and 2 rows before it holds
 * a single character, and an overlay that covers everything is just a screen.
 * `Modal` and `Drawer` fall back to their inline rendering here.
 */
export const OVERLAY_MIN_WIDTH = 24;
export const OVERLAY_MIN_HEIGHT = 8;

export function overlayFits(bounds: OverlayBounds): boolean {
  return bounds.width >= OVERLAY_MIN_WIDTH && bounds.height >= OVERLAY_MIN_HEIGHT;
}

/** [fraction of the bounds, minimum cells] per size. */
const MODAL_WIDTH: Record<OverlaySize, [number, number]> = {
  sm: [0.35, 24], md: [0.55, 32], lg: [0.72, 40], xl: [0.88, 48], full: [1, 0],
};
const MODAL_HEIGHT: Record<OverlaySize, [number, number]> = {
  sm: [0.3, 5], md: [0.45, 7], lg: [0.6, 9], xl: [0.78, 11], full: [1, 0],
};

/**
 * Centered modal geometry.
 *
 * The height is derived rather than measured from the content: Ink cannot
 * report a subtree's height before it is laid out, and the fill layer needs a
 * row count. A modal is therefore a box of a known size, like every other
 * dialog in a terminal.
 */
export function modalRect(bounds: OverlayBounds, size: OverlaySize = "md"): OverlayRect {
  const [widthFraction, minWidth] = MODAL_WIDTH[size];
  const [heightFraction, minHeight] = MODAL_HEIGHT[size];
  const width = clamp(Math.round(bounds.width * widthFraction), minWidth, bounds.width);
  const height = clamp(Math.round(bounds.height * heightFraction), minHeight, bounds.height);
  return { width, height, left: Math.floor((bounds.width - width) / 2), top: Math.floor((bounds.height - height) / 2) };
}

const DRAWER_FRACTION: Record<OverlaySize, number> = { sm: 0.25, md: 0.4, lg: 0.55, xl: 0.7, full: 1 };
const DRAWER_MIN_WIDTH: Record<OverlaySize, number> = { sm: 16, md: 24, lg: 32, xl: 40, full: 0 };
const DRAWER_MIN_HEIGHT: Record<OverlaySize, number> = { sm: 3, md: 5, lg: 7, xl: 9, full: 0 };

/**
 * Edge-anchored drawer geometry.
 *
 * `size` addresses the drawer's OWN axis — width on `left`/`right`, height on
 * `top`/`bottom` — and the cross axis always fills the bounds. One scale, two
 * meanings, so `size="lg"` does not have to be re-learned when a drawer moves
 * from the side to the bottom. Same rule as `react-fancy`'s `Drawer`.
 */
export function drawerRect(bounds: OverlayBounds, side: DrawerSide = "right", size: OverlaySize = "md"): OverlayRect {
  const fraction = DRAWER_FRACTION[size];
  if (side === "left" || side === "right") {
    const width = clamp(Math.round(bounds.width * fraction), DRAWER_MIN_WIDTH[size], bounds.width);
    return { width, height: bounds.height, top: 0, left: side === "left" ? 0 : bounds.width - width };
  }
  const height = clamp(Math.round(bounds.height * fraction), DRAWER_MIN_HEIGHT[size], bounds.height);
  return { width: bounds.width, height, left: 0, top: side === "top" ? 0 : bounds.height - height };
}

/** The opaque layer. See the module note: padding is transparent in Ink. */
function OverlayFill({ rect }: { rect: OverlayRect }) {
  return (
    <InkBox position="absolute" left={rect.left} top={rect.top} width={rect.width} height={rect.height} flexDirection="column">
      {Array.from({ length: rect.height }, (_, row) => <InkText key={row}>{" ".repeat(rect.width)}</InkText>)}
    </InkBox>
  );
}

/** Fill + panel at identical coordinates. The panel MUST come second. */
export function OverlaySurface({ rect, tone = "neutral", children }: { rect: OverlayRect; tone?: TuiTone; children?: ReactNode }) {
  const { theme } = useFancyTui();
  return (
    <>
      <OverlayFill rect={rect} />
      <InkBox
        position="absolute"
        left={rect.left}
        top={rect.top}
        width={rect.width}
        height={rect.height}
        borderStyle={theme.borders.panel}
        borderColor={theme.colors[tone]}
        paddingX={theme.spacing.md}
        flexDirection="column"
      >
        {tuiNode(children)}
      </InkBox>
    </>
  );
}

export interface OverlayContextValue { id: string; close: () => void }
const OverlayContext = createContext<OverlayContextValue | null>(null);
/** The enclosing `Modal` / `Drawer`, for slots that need to close it. */
export const useOverlay = () => useContext(OverlayContext);
/** Publishes the enclosing overlay to its slots. Used by `Modal` and `Drawer`. */
export function OverlayProvider({ value, children }: { value: OverlayContextValue; children?: ReactNode }) {
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export interface OverlayHeaderProps { children?: ReactNode; closable?: boolean }
/**
 * Title row. `Modal.Header` / `Drawer.Header`.
 *
 * `[esc]` stands in for `react-fancy`'s close button — the keystroke IS the
 * affordance in a terminal. It never shrinks: a wrapped hint reads as `esc]` on
 * one line and `close` on the next, so the title gives way instead.
 */
export function OverlayHeader({ children, closable = true }: OverlayHeaderProps) {
  const overlay = useContext(OverlayContext);
  return (
    <Row>
      <InkBox flexShrink={1}>{tuiBoldNode(children)}</InkBox>
      <Spacer />
      {closable && overlay ? <InkBox flexShrink={0}><KeyHint keys="esc" /></InkBox> : null}
    </Row>
  );
}

/** Content row. Grows, so a footer sits on the panel's bottom edge. */
export function OverlayBody({ children }: { children?: ReactNode }) {
  return <InkBox flexDirection="column" flexGrow={1}>{tuiNode(children)}</InkBox>;
}

/** Action row, right-aligned like `react-fancy`'s. */
export function OverlayFooter({ children }: { children?: ReactNode }) {
  return <InkBox flexDirection="row" gap={1} justifyContent="flex-end">{tuiNode(children)}</InkBox>;
}

export interface DrawerProps extends InteractiveProps {
  open: boolean;
  onClose: () => void;
  /** Edge to anchor to. Default `right`. */
  side?: DrawerSide;
  /** Extent along the drawer's own axis; the cross axis fills. Default `md`. */
  size?: OverlaySize;
  /** Shorthand for a `Drawer.Header`. */
  title?: string;
  tone?: TuiTone;
  /** Region to anchor inside. Defaults to the terminal size. */
  bounds?: OverlayBounds;
  /** Render in flow instead of over the layout. */
  inline?: boolean;
  /** Escape closes. Default `true`. */
  dismissOnEscape?: boolean;
  children?: ReactNode;
}

/**
 * An edge-anchored panel that paints over the layout.
 *
 * ```tsx
 * <Drawer id="filters" open={open} onClose={close} side="right" size="md" title="Filters">
 *   <Drawer.Body><Text>Only failing jobs</Text></Drawer.Body>
 * </Drawer>
 * ```
 *
 * Attach it to something other than the terminal by rendering it inside that
 * region and passing the region's size — a Card, a layout pane, the box around
 * a prompt input (`Composer` / its `PromptInput` alias, both `MultilineInput`):
 *
 * ```tsx
 * <Card variant="outlined" width={40} height={12}>
 *   <Text>…</Text>
 *   <Drawer id="d" open bounds={{ width: 38, height: 10 }} side="bottom" size="sm" onClose={close}>
 *     <Drawer.Body>Attached to the card, not the screen.</Drawer.Body>
 *   </Drawer>
 * </Card>
 * ```
 *
 * Bounds are the region INSIDE the border (a 40-column bordered Card gives 38),
 * and getting them wrong is visible: too small and the layout bleeds through
 * the uncovered strip, too large and the drawer paints outside its region.
 */
function DrawerRoot({
  id,
  open,
  onClose,
  side = "right",
  size = "md",
  title,
  tone = "neutral",
  bounds,
  inline = false,
  dismissOnEscape = true,
  children,
}: DrawerProps) {
  const { width, height } = useTerminalSize();
  const regionWidth = bounds?.width ?? width;
  const regionHeight = bounds?.height ?? height;
  const region: OverlayBounds = { width: regionWidth, height: regionHeight };
  const mode = inline || !overlayFits(region) ? "inline" : "overlay";

  useInput((_input, key) => { if (open && dismissOnEscape && key.escape) onClose(); });

  useTuiSurface(useMemo(() => ({
    id,
    kind: "drawer",
    label: title ?? id,
    read: () => ({ open, side, size, mode, bounds: { width: regionWidth, height: regionHeight } }),
    commands: [{ name: "close", policy: "execute" as const, invoke: onClose }],
  }), [id, title, open, side, size, mode, regionWidth, regionHeight, onClose]));

  const overlay = useMemo(() => ({ id, close: onClose }), [id, onClose]);
  if (!open) return null;

  const body = (
    <>
      {title ? <OverlayHeader>{title}</OverlayHeader> : null}
      {tuiNode(children)}
    </>
  );

  return (
    <OverlayProvider value={overlay}>
      {mode === "overlay"
        ? <OverlaySurface rect={drawerRect(region, side, size)} tone={tone}>{body}</OverlaySurface>
        : <Panel tone={tone}>{body}</Panel>}
    </OverlayProvider>
  );
}

export const Drawer = Object.assign(DrawerRoot, {
  Header: OverlayHeader,
  Body: OverlayBody,
  Footer: OverlayFooter,
});
