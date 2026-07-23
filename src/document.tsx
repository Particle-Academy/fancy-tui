import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Box, Text as InkText, useInput } from "ink";
import { Text } from "./layout.js";
import { useFancyTui } from "./theme.js";
import { useTuiSurface } from "./registry.js";
import { renderMarkdown } from "./markdown/render.js";
import type { InteractiveProps } from "./types.js";

/**
 * Terminal counterpart to react-fancy's `ContentRenderer`.
 *
 * Two things the existing `Markdown` / `CodeView` cannot do, and which any
 * agent TUI showing a document needs:
 *
 *  - **Scrolling.** Ink has no viewport — content taller than the terminal just
 *    runs off. This keeps a fixed-height window over the rendered lines and
 *    moves an offset, so a plan or a spec is actually readable in place.
 *  - **Custom tags.** An agent's output is not only markdown; `<thinking>`,
 *    `<plan>`, `<diff>` blocks want their own rendering. The extension contract
 *    mirrors react-fancy's (`tag` + a component receiving `content` and
 *    `attributes`) so a concept learned on the web side transfers.
 */

/** Props handed to every document extension. Mirrors react-fancy's shape. */
export interface DocumentExtensionProps {
  /** Inner text of the matched tag. */
  content: string;
  /** Attributes parsed from the opening tag. */
  attributes: Record<string, string>;
}

export interface DocumentExtension {
  /** Tag to match, e.g. "thinking". Case-insensitive. */
  tag: string;
  component: ComponentType<DocumentExtensionProps>;
}

/** A parsed span — plain markdown, or a matched extension tag. */
export type DocumentSegment =
  | { type: "markdown"; content: string }
  | { type: "extension"; tag: string; content: string; attributes: Record<string, string> };

const globalExtensions: DocumentExtension[] = [];

/** Register a custom tag renderer for every `<DocumentViewer>`. */
export function registerDocumentExtension(extension: DocumentExtension): void {
  const i = globalExtensions.findIndex((e) => e.tag.toLowerCase() === extension.tag.toLowerCase());
  if (i >= 0) globalExtensions[i] = extension;
  else globalExtensions.push(extension);
}

export function registerDocumentExtensions(extensions: DocumentExtension[]): void {
  for (const e of extensions) registerDocumentExtension(e);
}

/** Snapshot of the globally registered extensions. */
export function getDocumentExtensions(): DocumentExtension[] {
  return [...globalExtensions];
}

/** Remove one, by tag. Returns whether anything was removed. */
export function unregisterDocumentExtension(tag: string): boolean {
  const i = globalExtensions.findIndex((e) => e.tag.toLowerCase() === tag.toLowerCase());
  if (i < 0) return false;
  globalExtensions.splice(i, 1);
  return true;
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Match a name ONCE, then an OPTIONAL quoted value — not three alternatives
  // each beginning with `[\w-]+`. The old alternation re-scanned the same
  // `[\w-]+` run across branches whenever a name was not followed by `=`, a
  // polynomial ReDoS (CodeQL js/polynomial-redos) on inputs with many `-`.
  // `raw` is document content that may be untrusted, so this is a real DoS
  // vector, not a theoretical one. This form matches each name in linear time.
  const re = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1];
    if (name) attrs[name] = m[2] ?? m[3] ?? "";
  }
  return attrs;
}

/**
 * Split `value` into markdown spans and extension spans.
 *
 * Only registered tags are matched — an unknown `<tag>` stays literal markdown
 * rather than disappearing, so a typo shows up instead of silently eating text.
 */
export function segmentDocument(value: string, extensions: DocumentExtension[]): DocumentSegment[] {
  if (extensions.length === 0) return value ? [{ type: "markdown", content: value }] : [];

  const names = extensions.map((e) => e.tag.toLowerCase());
  const pattern = new RegExp(`<(${names.join("|")})([^>]*)>([\\s\\S]*?)<\\/\\1>`, "gi");

  const out: DocumentSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(value)) !== null) {
    if (m.index > last) out.push({ type: "markdown", content: value.slice(last, m.index) });
    out.push({
      type: "extension",
      tag: (m[1] ?? "").toLowerCase(),
      attributes: parseAttributes(m[2] ?? ""),
      content: m[3] ?? "",
    });
    last = m.index + m[0].length;
  }
  if (last < value.length) out.push({ type: "markdown", content: value.slice(last) });
  return out.filter((s) => s.type === "extension" || s.content !== "");
}

export interface DocumentViewerProps extends InteractiveProps {
  /** Document source. Markdown by default. */
  value: string;
  /** `"text"` skips markdown rendering — for logs and raw output. */
  format?: "markdown" | "text";
  /** Visible rows. Content taller than this scrolls. Default 20. */
  height?: number;
  /** Controlled scroll offset (first visible line). */
  scrollOffset?: number;
  onScrollChange?: (offset: number) => void;
  /** Per-instance extensions, merged over the global registry. */
  extensions?: DocumentExtension[];
  /** Hide the `12–31 / 210` position indicator. */
  showScrollbar?: boolean;
  title?: string;
}

/**
 * Scrollable document viewer.
 *
 * Keys while focused: ↑/↓ line, PgUp/PgDn page, Home/End ends, and j/k for
 * anyone with the muscle memory.
 */
export function DocumentViewer({
  id,
  value,
  format = "markdown",
  height = 20,
  scrollOffset,
  onScrollChange,
  extensions = [],
  showScrollbar = true,
  title,
  disabled = false,
  autoFocus = true,
}: DocumentViewerProps) {
  const { theme } = useFancyTui();
  const merged = useMemo(() => {
    const map = new Map<string, DocumentExtension>();
    for (const e of getDocumentExtensions()) map.set(e.tag.toLowerCase(), e);
    for (const e of extensions) map.set(e.tag.toLowerCase(), e);
    return [...map.values()];
  }, [extensions]);

  const segments = useMemo(() => segmentDocument(value, merged), [value, merged]);

  // Extension segments render as components, so the flat line list used for
  // scrolling only covers the markdown spans. Blocks are laid out in order and
  // the viewport is applied to the rendered lines of the whole document.
  const blocks = useMemo(
    () =>
      segments.map((seg) => {
        if (seg.type === "markdown") {
          const text = format === "markdown" ? renderMarkdown(seg.content) : seg.content;
          return { kind: "lines" as const, lines: text.replace(/\n+$/, "").split("\n") };
        }
        const ext = merged.find((e) => e.tag === seg.tag);
        return { kind: "node" as const, tag: seg.tag, ext, content: seg.content, attributes: seg.attributes };
      }),
    [segments, format, merged],
  );

  // An extension block occupies one row in the scroll model. Precise height
  // would need measurement Ink does not expose; treating it as a unit keeps
  // scrolling monotonic and never hides a block entirely.
  const rows = useMemo(() => {
    const out: Array<{ block: number; line: number }> = [];
    blocks.forEach((b, i) => {
      if (b.kind === "lines") b.lines.forEach((_, l) => out.push({ block: i, line: l }));
      else out.push({ block: i, line: 0 });
    });
    return out;
  }, [blocks]);

  const total = rows.length;
  const maxOffset = Math.max(0, total - height);
  const [internal, setInternal] = useState(0);
  const offset = Math.min(scrollOffset ?? internal, maxOffset);

  const scrollTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, maxOffset));
    if (scrollOffset === undefined) setInternal(clamped);
    onScrollChange?.(clamped);
  };

  useInput((input, key) => {
    if (disabled) return;
    if (key.upArrow || input === "k") return scrollTo(offset - 1);
    if (key.downArrow || input === "j") return scrollTo(offset + 1);
    if (key.pageUp) return scrollTo(offset - height);
    if (key.pageDown) return scrollTo(offset + height);
    if (input === "g") return scrollTo(0);
    if (input === "G") return scrollTo(maxOffset);
  });

  useTuiSurface(
    useMemo(
      () => ({
        id,
        kind: "document",
        label: title ?? id,
        read: () => ({ offset, total, height, atEnd: offset >= maxOffset }),
        commands: [
          { name: "scroll", invoke: (x) => scrollTo(Number(x?.offset ?? 0)) },
          { name: "scroll_end", invoke: () => scrollTo(maxOffset) },
        ],
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [id, title, offset, total, height, maxOffset],
    ),
  );

  const visible = rows.slice(offset, offset + height);
  const rendered: ReactNode[] = [];
  let cursor = 0;
  while (cursor < visible.length) {
    const row = visible[cursor]!;
    const block = blocks[row.block]!;
    if (block.kind === "node") {
      const Comp = block.ext?.component;
      rendered.push(
        <Box key={`x-${row.block}`} flexDirection="column">
          {Comp ? (
            <Comp content={block.content ?? ""} attributes={block.attributes ?? {}} />
          ) : (
            <Text tone="muted">{`<${block.tag}>`}</Text>
          )}
        </Box>,
      );
      cursor++;
      continue;
    }
    // Consecutive lines of one markdown block render as a single Text.
    const lines: string[] = [];
    const b = row.block;
    while (cursor < visible.length && visible[cursor]!.block === b) {
      lines.push((blocks[b] as { lines: string[] }).lines[visible[cursor]!.line] ?? "");
      cursor++;
    }
    rendered.push(<InkText key={`m-${b}-${offset}`}>{lines.join("\n")}</InkText>);
  }

  return (
    <Box flexDirection="column" data-document={id}>
      {title ? <Text bold color={theme.colors.primary}>{title}</Text> : null}
      <Box flexDirection="column" height={height}>{rendered}</Box>
      {showScrollbar && total > height ? (
        <Text tone="muted">
          {`${offset + 1}–${Math.min(offset + height, total)} / ${total}`}
          {offset >= maxOffset ? "  (end)" : "  ↑↓ PgUp/PgDn g/G"}
        </Text>
      ) : null}
    </Box>
  );
}
