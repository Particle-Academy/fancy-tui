import { useMemo } from "react";
import { Box } from "ink";
import { Breadcrumbs } from "./navigation.js";
import { Row, Stack, Text } from "./layout.js";
import { useTuiSurface } from "./registry.js";
import type { InteractiveProps } from "./types.js";

export interface TableColumn<T> { id: string; header: string; width?: number; render: (row: T) => string; }
export function Table<T>({ id, rows, columns, rowId, selectedIds = [], onSelectionChange }: InteractiveProps & { rows: readonly T[]; columns: readonly TableColumn<T>[]; rowId: (row: T) => string; selectedIds?: string[]; onSelectionChange?: (ids: string[]) => void }) {
  useTuiSurface(useMemo(() => ({ id, kind: "table", read: () => ({ rows, selectedIds }), commands: onSelectionChange ? [{ name: "select", invoke: (x) => onSelectionChange(Array.isArray(x?.ids) ? x.ids.map(String) : []) }] : [] }), [id, rows, selectedIds, onSelectionChange]));
  const cells = (values: string[]) => values.map((value, index) => value.padEnd(columns[index]?.width ?? 14).slice(0, columns[index]?.width ?? 14)).join(" │ ");
  return <Stack gap={0}><Text bold>{cells(columns.map((x) => x.header))}</Text><Text tone="muted">{"─".repeat(Math.max(1, columns.reduce((n, x) => n + (x.width ?? 14) + 3, -3)))}</Text>{rows.map((row) => { const key = rowId(row); return <Text key={key} tone={selectedIds.includes(key) ? "primary" : "text"}>{selectedIds.includes(key) ? "› " : "  "}{cells(columns.map((x) => x.render(row)))}</Text>; })}</Stack>;
}

export interface TreeNode { id: string; label: string; children?: TreeNode[]; }
export function TreeNav({ id, nodes, expandedIds, selectedId, onExpandedChange, onSelect }: InteractiveProps & { nodes: TreeNode[]; expandedIds: string[]; selectedId?: string; onExpandedChange: (ids: string[]) => void; onSelect: (id: string) => void }) {
  useTuiSurface(useMemo(() => ({ id, kind: "tree", read: () => ({ nodes, expandedIds, selectedId }), commands: [{ name: "select", invoke: (x) => onSelect(String(x?.id ?? "")) }, { name: "expand", invoke: (x) => onExpandedChange([...new Set([...expandedIds, String(x?.id ?? "")])]) }] }), [id, nodes, expandedIds, selectedId, onExpandedChange, onSelect]));
  const render = (items: TreeNode[], depth = 0): React.ReactNode[] => items.flatMap((node) => { const expanded = expandedIds.includes(node.id); return [<Text key={node.id} tone={node.id === selectedId ? "primary" : "text"}>{"  ".repeat(depth)}{node.children?.length ? (expanded ? "▾ " : "▸ ") : "  "}{node.label}</Text>, ...(expanded && node.children ? render(node.children, depth + 1) : [])]; });
  return <Stack gap={0}>{render(nodes)}</Stack>;
}
export interface FileEntry { id: string; name: string; kind: "file" | "directory"; size?: number; }
export function FileBrowser({ id, path, entries, selectedId, onPathChange, onSelect }: InteractiveProps & { path: string; entries: FileEntry[]; selectedId?: string; onPathChange: (path: string) => void; onSelect: (entry: FileEntry) => void }) {
  const crumbs = path.split(/[\\/]/).filter(Boolean).map((label, index) => ({ id: String(index), label }));
  return <Stack gap={0}><Breadcrumbs items={crumbs.length ? crumbs : [{ id: "root", label: "/" }]} />{entries.map((entry) => <Text key={entry.id} tone={entry.id === selectedId ? "primary" : "text"}>{entry.id === selectedId ? "›" : " "} {entry.kind === "directory" ? "▸" : "·"} {entry.name}{entry.size != null ? ` ${entry.size}b` : ""}</Text>)}</Stack>;
}
