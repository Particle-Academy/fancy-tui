import stringWidth from "string-width";

/**
 * The intermediate form every markdown construct renders to: lines of styled
 * spans. Styles are named, never raw ANSI, and are listed outermost first — a
 * bold word inside a blockquote is `["blockquote", "strong"]`.
 *
 * Keeping ANSI out until the very last step is what makes wrapping and width
 * measurement trustworthy. marked-terminal styled first and wrapped the escaped
 * string afterwards, so it measured bytes it had coloured, counted UTF-16 code
 * units as columns, and split lines in the middle of an open style.
 */
export type StyleName =
  | "h1"
  | "heading"
  | "strong"
  | "em"
  | "codespan"
  | "del"
  | "link"
  | "href"
  | "html"
  | "blockquote"
  | "tableHead"
  | "tableBorder"
  | "keyword"
  | "built_in"
  | "type"
  | "literal"
  | "number"
  | "string"
  | "regexp"
  | "comment"
  | "function"
  | "class"
  | "meta"
  | "tag"
  | "name"
  | "attr"
  | "addition"
  | "deletion";

export interface Span {
  text: string;
  styles: readonly StyleName[];
  /** A hard line break (`br`). Its `text` is ignored. */
  br?: true;
}

export type Line = Span[];

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Split into user-perceived characters, so a wrap never lands inside one. */
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/** Terminal columns — East Asian wide characters and emoji count as 2. */
export function columns(text: string): number {
  return /^[\x20-\x7e]*$/.test(text) ? text.length : stringWidth(text);
}

const clusterWidths = new Map<string, number>();

/** Width of one grapheme, cached: cutting a long CJK run measures thousands. */
function clusterColumns(cluster: string): number {
  let width = clusterWidths.get(cluster);
  if (width === undefined) {
    width = columns(cluster);
    if (clusterWidths.size < 4096) clusterWidths.set(cluster, width);
  }
  return width;
}

export function lineText(line: Line): string {
  return line.map((span) => span.text).join("");
}

export function lineColumns(line: Line): number {
  return columns(lineText(line));
}

function sameStyles(a: readonly StyleName[], b: readonly StyleName[]): boolean {
  return a.length === b.length && a.every((style, i) => style === b[i]);
}

/** Join neighbouring spans that carry identical styles, and drop empty ones. */
export function mergeSpans(line: Line): Line {
  const out: Line = [];
  for (const span of line) {
    if (span.text === "") continue;
    const last = out[out.length - 1];
    if (last && sameStyles(last.styles, span.styles)) last.text += span.text;
    else out.push({ text: span.text, styles: span.styles });
  }
  return out;
}

/** Add a style OUTSIDE every span of every line (a blockquote around its body). */
export function wrapStyle(lines: Line[], style: StyleName): Line[] {
  return lines.map((line) => line.map((span) => ({ ...span, styles: [style, ...span.styles] })));
}

/** Split spans at `\n` into lines, keeping each piece's styles. */
export function splitLines(spans: readonly Span[]): Line[] {
  const lines: Line[] = [[]];
  for (const span of spans) {
    const parts = span.text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part !== "") lines[lines.length - 1]!.push({ text: part, styles: span.styles });
    });
  }
  return lines;
}

interface Piece {
  text: string;
  styles: readonly StyleName[];
}

interface Word {
  pieces: Piece[];
  width: number;
  /** Styles of the whitespace that preceded this word, used for the joining space. */
  gapStyles: readonly StyleName[] | null;
}

function toWords(section: readonly Span[]): Word[] {
  const words: Word[] = [];
  let current: Word | null = null;
  let pendingGap: readonly StyleName[] | null = null;
  for (const span of section) {
    for (const part of span.text.split(/([ \t\n]+)/)) {
      if (part === "") continue;
      if (/^[ \t\n]+$/.test(part)) {
        if (current) {
          words.push(current);
          current = null;
        }
        pendingGap ??= span.styles;
        continue;
      }
      if (!current) {
        current = { pieces: [], width: 0, gapStyles: words.length === 0 ? null : pendingGap };
        pendingGap = null;
      }
      current.pieces.push({ text: part, styles: span.styles });
      current.width += columns(part);
    }
  }
  if (current) words.push(current);
  return words;
}

/**
 * Greedy word wrap at `width` terminal columns.
 *
 * The same algorithm marked-terminal used — runs of whitespace collapse to one
 * space, a word that does not fit starts the next line, and a word wider than the
 * whole line is cut into line-sized pieces — but measured in columns rather than
 * UTF-16 code units, cut only between graphemes, and applied to spans so a style
 * never crosses a line break.
 *
 * Hard breaks (`br` spans) always end a line.
 */
export function wrapSpans(spans: readonly Span[], width: number): Line[] {
  const limit = Math.max(1, Math.floor(width));
  const sections: Span[][] = [[]];
  for (const span of spans) {
    if (span.br) sections.push([]);
    else sections[sections.length - 1]!.push(span);
  }

  const lines: Line[] = [];
  for (const section of sections) {
    let line: Line = [];
    let used = 0;
    const flush = () => {
      lines.push(mergeSpans(line));
      line = [];
      used = 0;
    };

    for (const word of toWords(section)) {
      const gap = used > 0 ? 1 : 0;
      if (used + gap + word.width <= limit) {
        if (gap) line.push({ text: " ", styles: word.gapStyles ?? [] });
        line.push(...word.pieces);
        used += gap + word.width;
        continue;
      }
      if (word.width <= limit) {
        flush();
        line.push(...word.pieces);
        used = word.width;
        continue;
      }

      // Wider than a whole line: fill what is left of this one, then cut.
      let started = false;
      for (const piece of word.pieces) {
        for (const cluster of graphemes(piece.text)) {
          const w = clusterColumns(cluster);
          const needsGap = !started && used > 0;
          const cost = (needsGap ? 1 : 0) + w;
          if (used + cost > limit && used > 0) flush();
          if (!started && used > 0) {
            line.push({ text: " ", styles: word.gapStyles ?? [] });
            used += 1;
          }
          started = true;
          line.push({ text: cluster, styles: piece.styles });
          used += w;
        }
      }
    }
    if (line.length > 0) flush();
  }
  return lines;
}
