import { useMemo, type ReactNode } from "react";
import { Box, useFocus, useInput } from "ink";
import { Button } from "./inputs.js";
import { Panel, Row, Stack, Text, tuiNode } from "./layout.js";
import { OverlayBody, OverlayFooter, OverlayHeader, OverlayProvider, OverlaySurface, modalRect, overlayFits, type OverlayBounds, type OverlaySize } from "./overlay.js";
import { useTuiSurface } from "./registry.js";
import { useTerminalSize } from "./theme.js";
import type { InteractiveProps, Option, TuiTone } from "./types.js";

export function Tabs({ id, value, onChange, tabs }: InteractiveProps & { value: string; onChange: (id: string) => void; tabs: Array<Option & { content?: ReactNode }> }) {
  const active = tabs.find((x) => x.id === value);
  return <Stack><Row>{tabs.map((tab) => <Button key={tab.id} id={`${id}:${tab.id}`} onPress={() => onChange(tab.id)} tone={tab.id === value ? "primary" : "neutral"}>{tab.label}</Button>)}</Row>{tuiNode(active?.content)}</Stack>;
}
export function Accordion({ id, value, onChange, items }: InteractiveProps & { value: string[]; onChange: (ids: string[]) => void; items: Array<Option & { content?: ReactNode }> }) {
  return <Stack gap={0}>{items.map((item) => { const open = value.includes(item.id); return <Stack gap={0} key={item.id}><Button id={`${id}:${item.id}`} tone="neutral" onPress={() => onChange(open ? value.filter((x) => x !== item.id) : [...value, item.id])}>{open ? "▾" : "▸"} {item.label}</Button>{open ? <Box marginLeft={2}>{tuiNode(item.content)}</Box> : null}</Stack>; })}</Stack>;
}
export function Breadcrumbs({ items }: { items: Array<{ id: string; label: string }> }) { return <Text>{items.map((x) => x.label).join(" › ")}</Text>; }
export function Pagination({ id, page, pages, onChange }: InteractiveProps & { page: number; pages: number; onChange: (page: number) => void }) { return <Row><Button id={`${id}:prev`} disabled={page <= 1} onPress={() => onChange(page - 1)}>Prev</Button><Text>{page} / {pages}</Text><Button id={`${id}:next`} disabled={page >= pages} onPress={() => onChange(page + 1)}>Next</Button></Row>; }

export function Menu({ id, value, onChange, items, disabled = false, autoFocus = true }: InteractiveProps & { value?: string; onChange: (id: string) => void; items: Option[] }) {
  const { isFocused } = useFocus({ id, isActive: !disabled, autoFocus }); let index = Math.max(0, items.findIndex((x) => x.id === value));
  useInput((_input, key) => { if (!isFocused) return; if (key.downArrow) onChange(items[Math.min(items.length - 1, index + 1)]?.id ?? value ?? ""); if (key.upArrow) onChange(items[Math.max(0, index - 1)]?.id ?? value ?? ""); });
  return <Stack gap={0}>{items.map((item) => <Text key={item.id} tone={item.id === value ? "primary" : "text"}>{item.id === value ? "› " : "  "}{item.label}</Text>)}</Stack>;
}
export const Dropdown = Menu;

export interface ModalProps extends InteractiveProps {
  open: boolean;
  onClose: () => void;
  /** Shorthand for a `Modal.Header`. */
  title?: string;
  /** Overlay size, computed from `bounds`. Default `md`. */
  size?: OverlaySize;
  /** Render in flow — the pre-0.6 behaviour — instead of over the layout. */
  inline?: boolean;
  /** Region to center inside. Defaults to the terminal size. */
  bounds?: OverlayBounds;
  tone?: TuiTone;
  /** Show the escape hint and the Close button. Default `true`. */
  closable?: boolean;
  children?: ReactNode;
}

/**
 * A centered dialog painted over the layout.
 *
 * Overlay by default since 0.6: absolutely positioned, sized from the terminal,
 * and made opaque by a fill layer (Ink's padding cells are transparent, so a
 * panel alone lets the layout bleed through its own margins — see
 * `src/overlay.tsx`). Pass `inline` for the old in-flow rendering, which is
 * also what a terminal narrower than `OVERLAY_MIN_WIDTH` / shorter than
 * `OVERLAY_MIN_HEIGHT` falls back to on its own.
 *
 * An overlay only paints on rows the layout already owns — wrap the app in
 * `<Screen fullHeight>` or the dialog silently renders nothing.
 */
function ModalRoot({ id, open, title, children, onClose, size = "md", inline = false, bounds, tone = "neutral", closable = true }: ModalProps) {
  const { width, height } = useTerminalSize();
  const regionWidth = bounds?.width ?? width;
  const regionHeight = bounds?.height ?? height;
  const region: OverlayBounds = { width: regionWidth, height: regionHeight };
  const mode = inline || !overlayFits(region) ? "inline" : "overlay";

  useInput((_i, key) => { if (open && key.escape) onClose(); });

  useTuiSurface(useMemo(() => ({
    id,
    kind: "modal",
    label: title ?? id,
    read: () => ({ open, title, size, mode, bounds: { width: regionWidth, height: regionHeight } }),
    commands: [{ name: "close", policy: "execute" as const, invoke: onClose }],
  }), [id, title, open, size, mode, regionWidth, regionHeight, onClose]));

  const overlay = useMemo(() => ({ id, close: onClose }), [id, onClose]);
  if (!open) return null;

  const close = closable ? <Button id={`${id}:close`} onPress={onClose}>Close</Button> : null;

  return (
    <OverlayProvider value={overlay}>
      {mode === "overlay" ? (
        <OverlaySurface rect={modalRect(region, size)} tone={tone}>
          {title ? <OverlayHeader closable={closable}>{title}</OverlayHeader> : null}
          <OverlayBody>{children}</OverlayBody>
          {close ? <OverlayFooter>{close}</OverlayFooter> : null}
        </OverlaySurface>
      ) : (
        <Panel title={title} focused><Stack>{children}{close}</Stack></Panel>
      )}
    </OverlayProvider>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: OverlayHeader,
  Body: OverlayBody,
  Footer: OverlayFooter,
});
export interface ToastData { id: string; message: string; tone?: "success" | "warning" | "danger" | "info"; }
export function Toast({ items }: { items: readonly ToastData[] }) { return <Stack gap={0}>{items.map((item) => <Text key={item.id} tone={item.tone ?? "info"}>● {item.message}</Text>)}</Stack>; }
export function Command({ id, query, onQueryChange, commands, onSelect }: InteractiveProps & { query: string; onQueryChange: (value: string) => void; commands: Option[]; onSelect: (id: string) => void }) {
  const filtered = commands.filter((x) => x.label.toLowerCase().includes(query.toLowerCase()));
  return <Panel title="Command"><Stack><Text tone="muted">Search: {query || "…"}</Text>{filtered.map((command) => <Button key={command.id} id={`${id}:${command.id}`} onPress={() => onSelect(command.id)}>{command.label}</Button>)}</Stack></Panel>;
}
