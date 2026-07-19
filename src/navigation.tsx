import { useMemo, type ReactNode } from "react";
import { Box, useFocus, useInput } from "ink";
import { Button } from "./inputs.js";
import { Panel, Row, Stack, Text, tuiNode } from "./layout.js";
import { useTuiSurface } from "./registry.js";
import type { InteractiveProps, Option } from "./types.js";

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
export function Modal({ id, open, title, children, onClose }: InteractiveProps & { open: boolean; title: string; children?: ReactNode; onClose: () => void }) {
  useInput((_i, key) => { if (open && key.escape) onClose(); }); if (!open) return null;
  return <Panel title={title} focused><Stack>{children}<Button id={`${id}:close`} onPress={onClose}>Close</Button></Stack></Panel>;
}
export interface ToastData { id: string; message: string; tone?: "success" | "warning" | "danger" | "info"; }
export function Toast({ items }: { items: readonly ToastData[] }) { return <Stack gap={0}>{items.map((item) => <Text key={item.id} tone={item.tone ?? "info"}>● {item.message}</Text>)}</Stack>; }
export function Command({ id, query, onQueryChange, commands, onSelect }: InteractiveProps & { query: string; onQueryChange: (value: string) => void; commands: Option[]; onSelect: (id: string) => void }) {
  const filtered = commands.filter((x) => x.label.toLowerCase().includes(query.toLowerCase()));
  return <Panel title="Command"><Stack><Text tone="muted">Search: {query || "…"}</Text>{filtered.map((command) => <Button key={command.id} id={`${id}:${command.id}`} onPress={() => onSelect(command.id)}>{command.label}</Button>)}</Stack></Panel>;
}
