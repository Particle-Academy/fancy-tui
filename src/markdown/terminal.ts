import chalk, { Chalk, type ChalkInstance } from "chalk";
import { Marked, type Token, type Tokens } from "marked";
import { highlightCode } from "./highlight.js";
import {
  columns,
  lineText,
  mergeSpans,
  splitLines,
  wrapSpans,
  wrapStyle,
  type Line,
  type Span,
  type StyleName,
} from "./spans.js";

/**
 * Markdown to ANSI, walking marked's tokens.
 *
 * This replaced marked-terminal (unmaintained since 2025). It keeps that
 * renderer's visual vocabulary — `#` heading prefixes, `*` bullets, two-space
 * indents, `text (url)` links, box-drawn tables and its colour palette — and
 * fixes what it got wrong: list numbering, inline formatting in list items,
 * width measured in code units instead of columns, styles cut in half by line
 * breaks, full resets that erased enclosing styles, and OSC 8 hyperlinks whose
 * visible text could name a different URL from the one they opened.
 *
 * Internal. The public surface is `renderMarkdown(source)`.
 */

export interface TerminalMarkdownOptions {
  /** Wrap width in terminal columns. Default 80. */
  width?: number;
  /** Chalk colour level (0-3). Default: detected from the environment, like chalk itself. */
  level?: 0 | 1 | 2 | 3;
}

const DEFAULT_WIDTH = 80;
const INDENT = "  ";

type Styler = (text: string) => string;

function stylers(c: ChalkInstance): Record<StyleName, Styler> {
  return {
    h1: c.magenta.underline.bold,
    heading: c.green.bold,
    strong: c.bold,
    em: c.italic,
    codespan: c.yellow,
    del: c.dim.gray.strikethrough,
    link: c.blue,
    href: c.blue.underline,
    html: c.gray,
    blockquote: c.gray.italic,
    tableHead: c.red,
    tableBorder: c.gray,
    keyword: c.blue,
    built_in: c.cyan,
    type: c.cyan.dim,
    literal: c.blue,
    number: c.green,
    string: c.red,
    regexp: c.red,
    comment: c.green,
    function: c.yellow,
    class: c.blue,
    meta: c.gray,
    tag: c.gray,
    name: c.blue,
    attr: c.cyan,
    addition: c.green,
    deletion: c.red,
  };
}

const parser = new Marked();

// marked hands text through raw; these five are what an author types to mean a
// literal character. Code spans and code blocks are literal and never decoded.
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
}

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

function inline(tokens: readonly Token[] | undefined, outer: readonly StyleName[]): Span[] {
  const out: Span[] = [];
  for (const token of tokens ?? []) out.push(...inlineToken(token, outer));
  return out;
}

function span(text: string, outer: readonly StyleName[], style?: StyleName): Span {
  return { text, styles: style ? [...outer, style] : outer };
}

function inlineToken(token: Token, outer: readonly StyleName[]): Span[] {
  switch (token.type) {
    case "text": {
      const t = token as Tokens.Text;
      return t.tokens?.length ? inline(t.tokens, outer) : [span(decodeEntities(t.text), outer)];
    }
    case "escape":
      return [span((token as Tokens.Escape).text, outer)];
    case "strong":
      return inline((token as Tokens.Strong).tokens, [...outer, "strong"]);
    case "em":
      return inline((token as Tokens.Em).tokens, [...outer, "em"]);
    case "del":
      return inline((token as Tokens.Del).tokens, [...outer, "del"]);
    case "codespan":
      return [span((token as Tokens.Codespan).text, outer, "codespan")];
    case "br":
      return [{ text: "\n", styles: outer, br: true }];
    case "html":
      return [span((token as Tokens.HTML).text, outer, "html")];
    case "link": {
      const link = token as Tokens.Link;
      const within: StyleName[] = [...outer, "link"];
      const text = inline(link.tokens, within);
      const href = decodeEntities(link.href);
      const plain = text.map((s) => s.text).join("");
      // Always print the destination. An OSC 8 hyperlink shows only its label,
      // and in agent output the label is untrusted: `[https://bank](https://evil)`.
      if (plain === "" || plain === href) return [span(href, within, "href")];
      return [...text, span(" (", within), span(href, within, "href"), span(")", within)];
    }
    case "image": {
      const image = token as Tokens.Image;
      const title = image.title ? ` – ${image.title}` : "";
      return [span(`![${decodeEntities(image.text)}${title}](${decodeEntities(image.href)})`, outer)];
    }
    default: {
      const generic = token as { tokens?: Token[]; text?: string };
      if (generic.tokens?.length) return inline(generic.tokens, outer);
      return typeof generic.text === "string" ? [span(generic.text, outer)] : [];
    }
  }
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** Indent every line, blank ones included (a code block's or a quote's). */
function indent(lines: Line[]): Line[] {
  return lines.map((line) => [span(INDENT, []), ...line]);
}

/** Join rendered blocks, separated by `gap` blank lines. Empty blocks vanish. */
function joinBlocks(blocks: Line[][], gap: number): Line[] {
  const out: Line[] = [];
  for (const block of blocks) {
    if (block.length === 0) continue;
    if (out.length > 0) for (let i = 0; i < gap; i++) out.push([]);
    out.push(...block);
  }
  return out;
}

function blocks(tokens: readonly Token[], width: number, gap: number): Line[] {
  return joinBlocks(
    tokens.map((token) => block(token, width)),
    gap,
  );
}

function block(token: Token, width: number): Line[] {
  switch (token.type) {
    case "space":
    case "def":
      return [];
    case "heading": {
      const heading = token as Tokens.Heading;
      const style: StyleName = heading.depth === 1 ? "h1" : "heading";
      const spans = [span(`${"#".repeat(heading.depth)} `, [style]), ...inline(heading.tokens, [style])];
      return wrapSpans(spans, width);
    }
    case "paragraph":
      return wrapSpans(inline((token as Tokens.Paragraph).tokens, []), width);
    case "text": {
      const text = token as Tokens.Text;
      const spans = text.tokens?.length ? inline(text.tokens, []) : [span(decodeEntities(text.text), [])];
      return wrapSpans(spans, width);
    }
    case "code": {
      const code = token as Tokens.Code;
      const text = code.text.replace(/\n+$/, "");
      if (text === "") return [];
      return indent(splitLines(highlightCode(text, code.lang)));
    }
    case "blockquote": {
      const quote = token as Tokens.Blockquote;
      const body = trimBlankLines(blocks(quote.tokens, width - INDENT.length, 1));
      return wrapStyle(indent(body), "blockquote");
    }
    case "list":
      return list(token as Tokens.List, width);
    case "table":
      return table(token as Tokens.Table);
    case "hr":
      return [[span("-".repeat(Math.max(1, width - 1)), [])]];
    case "html": {
      const html = (token as Tokens.HTML).text.replace(/\n+$/, "");
      return html.split("\n").map((line) => (line === "" ? [] : [span(line, [], "html")]));
    }
    default: {
      const generic = token as { tokens?: Token[]; text?: string };
      if (generic.tokens?.length) return wrapSpans(inline(generic.tokens, []), width);
      return typeof generic.text === "string" ? wrapSpans([span(generic.text, [])], width) : [];
    }
  }
}

function trimBlankLines(lines: Line[]): Line[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lineText(lines[start]!).trim() === "") start++;
  while (end > start && lineText(lines[end - 1]!).trim() === "") end--;
  return lines.slice(start, end);
}

function list(token: Tokens.List, width: number): Line[] {
  const start = typeof token.start === "number" ? token.start : 1;
  const out: Line[] = [];
  token.items.forEach((item, index) => {
    const marker = token.ordered ? `${start + index}. ` : "* ";
    const hanging = " ".repeat(marker.length);
    const textWidth = width - INDENT.length - marker.length;

    const entries: Array<{ line: Line; nested: boolean }> = [];
    item.tokens.forEach((child, childIndex) => {
      if (child.type === "list") {
        // A nested list indents from THIS list, not from the item's text — the
        // layout marked-terminal produced, kept so nested lists do not move.
        for (const line of list(child as Tokens.List, width - INDENT.length)) entries.push({ line, nested: true });
        return;
      }
      let lines = block(child, textWidth);
      if (childIndex === 0 && item.task) {
        const box = span(item.checked ? "[X] " : "[ ] ", []);
        lines = lines.length === 0 ? [[box]] : [[box, ...lines[0]!], ...lines.slice(1)];
      }
      for (const line of lines) entries.push({ line, nested: false });
    });

    // Blank lines never appear inside an item, which keeps loose lists compact —
    // also marked-terminal's behaviour.
    const content = entries.filter((entry) => entry.line.length > 0);
    if (content.length === 0) {
      out.push([span(INDENT + marker.trimEnd(), [])]);
      return;
    }
    content.forEach(({ line, nested }, i) => {
      const lead = i === 0 ? INDENT + marker : nested ? INDENT : INDENT + hanging;
      out.push([span(lead, []), ...line]);
    });
  });
  return out;
}

function table(token: Tokens.Table): Line[] {
  const header = token.header.map((cell) => flatten(inline(cell.tokens, [])));
  const rows = token.rows.map((row) => row.map((cell) => flatten(inline(cell.tokens, []))));
  const count = Math.max(header.length, ...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let col = 0; col < count; col++) {
    const cells = [header[col], ...rows.map((r) => r[col])];
    widths.push(Math.max(0, ...cells.map((c) => (c ? columns(lineText(c)) : 0))));
  }

  const border = (left: string, mid: string, right: string): Line => [
    span(left + widths.map((w) => "─".repeat(w + 2)).join(mid) + right, ["tableBorder"]),
  ];
  const row = (cells: Line[], head: boolean): Line => {
    const line: Line = [span("│", ["tableBorder"])];
    for (let col = 0; col < count; col++) {
      const content = cells[col] ?? [];
      const free = widths[col]! - columns(lineText(content));
      const align = token.align[col];
      const left = align === "right" ? free : align === "center" ? Math.floor(free / 2) : 0;
      const cellSpans: Line = [span(" ".repeat(left + 1), []), ...content, span(" ".repeat(free - left + 1), [])];
      line.push(...(head ? cellSpans.map((s) => ({ ...s, styles: ["tableHead", ...s.styles] as StyleName[] })) : cellSpans));
      line.push(span("│", ["tableBorder"]));
    }
    return line;
  };

  const out: Line[] = [border("┌", "┬", "┐"), row(header, true)];
  rows.forEach((cells) => {
    out.push(border("├", "┼", "┤"), row(cells, false));
  });
  out.push(border("└", "┴", "┘"));
  return out;
}

/** Table cells are one line: hard breaks and newlines become spaces. */
function flatten(spans: Span[]): Line {
  return mergeSpans(spans.map((s) => ({ text: s.br ? " " : s.text.replace(/\n/g, " "), styles: s.styles })));
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const stylerCache = new WeakMap<ChalkInstance, Record<StyleName, Styler>>();

function toAnsi(lines: Line[], c: ChalkInstance): string {
  let table = stylerCache.get(c);
  if (!table) {
    table = stylers(c);
    stylerCache.set(c, table);
  }
  const styleFor = table;
  return lines
    .map((line) =>
      mergeSpans(line)
        .map((s) => s.styles.reduceRight((text, name) => styleFor[name](text), s.text))
        .join(""),
    )
    .join("\n");
}

const chalkByLevel = new Map<number, ChalkInstance>();

export function renderTerminalMarkdown(source: string, options: TerminalMarkdownOptions = {}): string {
  const width = options.width ?? DEFAULT_WIDTH;
  let c: ChalkInstance = chalk;
  if (options.level !== undefined) {
    c = chalkByLevel.get(options.level) ?? new Chalk({ level: options.level });
    chalkByLevel.set(options.level, c);
  }
  const tokens = parser.lexer(source);
  return toAnsi(trimEnd(blocks(tokens, width, 1)), c);
}

/**
 * Drop trailing whitespace from the document, before styling. Trimming the
 * ANSI string instead would stop at the first closing escape, so coloured
 * output would keep whitespace that plain output loses.
 */
function trimEnd(lines: Line[]): Line[] {
  const out = [...lines];
  while (out.length > 0 && lineText(out[out.length - 1]!).trim() === "") out.pop();
  const last = out[out.length - 1];
  if (!last) return out;
  const trimmed = mergeSpans(last).map((s) => ({ ...s }));
  while (trimmed.length > 0) {
    const tail = trimmed[trimmed.length - 1]!;
    tail.text = tail.text.replace(/\s+$/, "");
    if (tail.text !== "") break;
    trimmed.pop();
  }
  out[out.length - 1] = trimmed;
  return out;
}
