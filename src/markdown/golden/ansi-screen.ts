/**
 * Test support: what an ANSI string LOOKS like, independent of the bytes.
 *
 * Two renderers can draw identical output with different escape sequences —
 * marked-terminal wrapped every paragraph in redundant full resets, and chalk
 * re-opens an outer colour after every inner one closes. Comparing bytes would
 * report hundreds of differences nobody can see. This interprets SGR sequences
 * the way a terminal does and describes each visible cell instead.
 *
 * It is also the ANSI correctness check: anything that is not a complete SGR
 * sequence (or an OSC 8 hyperlink, recorded so it can be asserted absent) is
 * reported as an error rather than silently skipped.
 */

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

interface State {
  fg: string;
  bg: string;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  inverse: boolean;
  strike: boolean;
  link: string;
}

const DEFAULT: State = { fg: "", bg: "", bold: false, dim: false, italic: false, underline: false, inverse: false, strike: false, link: "" };

export interface AnsiScreen {
  /** One entry per line: runs of text with the visible style they carry. */
  lines: string[];
  /** Malformed or unsupported escape sequences. */
  errors: string[];
  /** 1-based line numbers whose style was still active when the line ended. */
  unbalancedLines: number[];
  /** OSC 8 hyperlink targets encountered. */
  hyperlinks: string[];
}

function applySgr(state: State, params: number[]): void {
  if (params.length === 0) params = [0];
  for (let i = 0; i < params.length; i++) {
    const p = params[i]!;
    if (p === 0) Object.assign(state, { ...DEFAULT, link: state.link });
    else if (p === 1) state.bold = true;
    else if (p === 2) state.dim = true;
    else if (p === 3) state.italic = true;
    else if (p === 4) state.underline = true;
    else if (p === 7) state.inverse = true;
    else if (p === 9) state.strike = true;
    else if (p === 22) state.bold = state.dim = false;
    else if (p === 23) state.italic = false;
    else if (p === 24) state.underline = false;
    else if (p === 27) state.inverse = false;
    else if (p === 29) state.strike = false;
    else if ((p >= 30 && p <= 37) || (p >= 90 && p <= 97)) state.fg = String(p);
    else if (p === 39) state.fg = "";
    else if ((p >= 40 && p <= 47) || (p >= 100 && p <= 107)) state.bg = String(p);
    else if (p === 49) state.bg = "";
    else if (p === 38 || p === 48) {
      const mode = params[i + 1];
      const take = mode === 5 ? 2 : mode === 2 ? 4 : 0;
      const value = params.slice(i + 1, i + 1 + take).join(";");
      if (p === 38) state.fg = `38;${value}`;
      else state.bg = `48;${value}`;
      i += take;
    }
  }
}

function describe(state: State, text: string): string {
  const visibleOnSpace = !/\S/.test(text);
  const flags: string[] = [];
  if (!visibleOnSpace && state.fg) flags.push(`fg${state.fg}`);
  if (state.bg) flags.push(`bg${state.bg}`);
  if (!visibleOnSpace && state.bold) flags.push("bold");
  if (!visibleOnSpace && state.dim) flags.push("dim");
  if (!visibleOnSpace && state.italic) flags.push("italic");
  if (state.underline) flags.push("underline");
  if (state.inverse) flags.push("inverse");
  if (state.strike) flags.push("strike");
  if (state.link) flags.push(`link=${state.link}`);
  return flags.join(",");
}

function isDefault(state: State): boolean {
  return Object.entries(DEFAULT).every(([key, value]) => state[key as keyof State] === value);
}

export function readAnsi(output: string): AnsiScreen {
  const state: State = { ...DEFAULT };
  const lines: string[] = [];
  const errors: string[] = [];
  const unbalancedLines: number[] = [];
  const hyperlinks: string[] = [];

  let cells: Array<{ ch: string; style: string }> = [];
  const add = (ch: string) => cells.push({ ch, style: describe(state, ch) });
  const endLine = () => {
    // A space with no visible style of its own, between two cells that share a
    // style, reads as part of that run. Decided from descriptions alone, so two
    // renderers that style the space differently still describe it identically.
    cells.forEach((cell, index) => {
      if (/\S/.test(cell.ch) || cell.style !== "") return;
      let left = index - 1;
      while (left >= 0 && !/\S/.test(cells[left]!.ch) && cells[left]!.style === "") left--;
      let right = index + 1;
      while (right < cells.length && !/\S/.test(cells[right]!.ch) && cells[right]!.style === "") right++;
      const before = cells[left]?.style;
      if (before && before === cells[right]?.style) cell.style = before;
    });
    const runs: Array<{ text: string; style: string }> = [];
    for (const cell of cells) {
      const last = runs[runs.length - 1];
      if (last && last.style === cell.style) last.text += cell.ch;
      else runs.push({ text: cell.ch, style: cell.style });
    }
    lines.push(runs.map((r) => `${JSON.stringify(r.text)}${r.style ? `{${r.style}}` : ""}`).join(" "));
    if (!isDefault(state)) unbalancedLines.push(lines.length);
    cells = [];
  };

  let i = 0;
  while (i < output.length) {
    const ch = output[i]!;
    if (ch === ESC) {
      if (output[i + 1] === "[") {
        const m = /^\[([\d;]*)m/.exec(output.slice(i + 1));
        if (!m) {
          errors.push(`unsupported CSI at ${i}: ${JSON.stringify(output.slice(i, i + 12))}`);
          i += 2;
          continue;
        }
        applySgr(state, m[1] === "" ? [] : m[1]!.split(";").map(Number));
        i += 1 + m[0].length;
        continue;
      }
      if (output[i + 1] === "]") {
        const end = output.indexOf(BEL, i);
        if (end === -1) {
          errors.push(`unterminated OSC at ${i}`);
          break;
        }
        const body = output.slice(i + 2, end);
        if (body.startsWith("8;;")) {
          state.link = body.slice(3);
          if (state.link) hyperlinks.push(state.link);
        } else errors.push(`unsupported OSC at ${i}: ${JSON.stringify(body)}`);
        i = end + 1;
        continue;
      }
      errors.push(`bare ESC at ${i}`);
      i++;
      continue;
    }
    if (ch === "\n") {
      endLine();
      i++;
      continue;
    }
    const code = ch.codePointAt(0)!;
    if ((code < 32 && ch !== "\t") || code === 0x7f) errors.push(`control character ${code} at ${i}`);
    const cp = String.fromCodePoint(code);
    add(cp);
    i += cp.length;
  }
  endLine();
  if (!isDefault(state)) errors.push("style still active at end of output");
  return { lines, errors, unbalancedLines, hyperlinks };
}

/** Visible description of an ANSI string — equal descriptions look identical. */
export function visibleAnsi(output: string): string {
  return readAnsi(output).lines.join("\n");
}
