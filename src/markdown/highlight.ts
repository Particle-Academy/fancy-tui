import type { Span, StyleName } from "./spans.js";

/**
 * First-party syntax highlighting for fenced code blocks.
 *
 * A small scanner, not a grammar engine. It classifies the token kinds that carry
 * most of the reading value — comments, strings, numbers, keywords, literals and
 * built-ins, plus function/class signatures, JSX tags and decorators — and colours
 * them with the palette highlight.js used through marked-terminal, so a block
 * that used to be highlighted still reads the same way.
 *
 * Coverage is deliberately the languages the Fancy suite is written in and the
 * formats agents emit most: TypeScript/JavaScript (+ JSX), JSON, shell, Python,
 * PHP, SQL, YAML and diffs. Any other language — or none — renders uncoloured.
 * Guessing is not attempted: highlight.js' auto-detection painted ordinary prose
 * in an unlabelled fence as keywords.
 *
 * Tokens partition the input exactly — no character is added or removed — so
 * highlighting can never change a line's width.
 */

const words = (list: string): Set<string> => new Set(list.trim().split(/\s+/));

const JS_KEYWORDS = words(`
  as in of if for while finally var new function do return void else break catch
  instanceof with throw case default try switch continue typeof delete let yield
  const class debugger async await static import from export extends`);
const JS_LITERALS = words("true false null undefined NaN Infinity");
const JS_BUILT_INS = words(`
  setInterval setTimeout clearInterval clearTimeout require exports eval isFinite
  isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI
  encodeURIComponent escape unescape arguments this super console window document
  localStorage module global Intl DataView Number Math Date String RegExp Object
  Function Boolean Error Symbol Set Map WeakSet WeakMap Proxy Reflect JSON Promise
  Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array
  Float32Array Array Uint8Array Uint8ClampedArray ArrayBuffer BigInt64Array
  BigUint64Array BigInt EvalError InternalError RangeError ReferenceError
  SyntaxError TypeError URIError`);
const TS_KEYWORDS = words(`${[...JS_KEYWORDS].join(" ")}
  type namespace typedef interface public private protected implements declare
  abstract readonly`);
const TS_BUILT_INS = words(`${[...JS_BUILT_INS].join(" ")} any void number boolean string object never enum unknown`);

const PY_KEYWORDS = words(`
  and as assert async await break class continue def del elif else except finally
  for from global if import in is lambda nonlocal not or pass raise return try
  while with yield match case`);
const PY_LITERALS = words("__debug__ Ellipsis False None NotImplemented True");
const PY_BUILT_INS = words(`
  __import__ abs all any ascii bin bool breakpoint bytearray bytes callable chr
  classmethod compile complex delattr dict dir divmod enumerate eval exec filter
  float format frozenset getattr globals hasattr hash help hex id input int
  isinstance issubclass iter len list locals map max memoryview min next object
  oct open ord pow print property range repr reversed round set setattr slice
  sorted staticmethod str sum super tuple type vars zip self`);

const PHP_KEYWORDS = words(`
  __CLASS__ __DIR__ __FILE__ __FUNCTION__ __LINE__ __METHOD__ __NAMESPACE__
  __TRAIT__ die echo exit include include_once print require require_once array
  abstract and as binary bool boolean break callable case catch class clone const
  continue declare default do double else elseif empty enddeclare endfor
  endforeach endif endswitch endwhile enum eval extends final finally float fn for
  foreach from global goto if implements instanceof insteadof int integer
  interface isset iterable list match mixed namespace new object or private
  protected public readonly real return static string switch throw trait try
  unset use var void while xor yield`);
const PHP_LITERALS = words("false null true");
const PHP_BUILT_INS = words(`
  Error Exception Throwable ArrayAccess ArrayIterator Closure Countable Generator
  Iterator IteratorAggregate JsonSerializable Stringable Traversable stdClass
  DateTime DateTimeImmutable DateTimeInterface`);

const SH_KEYWORDS = words("if then else elif fi for while in do done case esac function select until time");
const SH_LITERALS = words("true false");
const SH_BUILT_INS = words(`
  break cd continue eval exec exit export getopts hash pwd readonly return shift
  test times trap umask unset alias bind builtin caller command declare echo
  enable help let local logout mapfile printf read readarray source type typeset
  ulimit unalias set shopt sudo`);

const SQL_KEYWORDS = words(`
  select from where insert into values update set delete create table alter drop
  join left right inner outer full cross on as and or not is in like between
  exists having group order by limit offset distinct union all primary key
  foreign references index unique default case when then else end with returning
  view trigger procedure function begin commit rollback transaction grant revoke
  if replace database schema column add constraint check asc desc top fetch next
  rows only over partition`);
const SQL_LITERALS = words("true false null");
const SQL_TYPES = words(`
  int integer bigint smallint tinyint decimal numeric float real double varchar
  char text date time timestamp datetime boolean bool blob json jsonb uuid serial`);
const SQL_BUILT_INS = words("count sum avg min max coalesce now lower upper length substring cast concat round");

interface Signature {
  /** Keyword that opens the signature. */
  keyword: string;
  style: StyleName;
  /** Characters that end it, at bracket depth 0. */
  end: string;
  /** Whether the end character belongs to the signature (Python's `:`). */
  inclusive: boolean;
}

interface CLike {
  keywords: Set<string>;
  literals: Set<string>;
  builtIns: Set<string>;
  types?: Set<string>;
  caseInsensitive?: boolean;
  lineComments: string[];
  /** Line comments that only start at a word boundary (shell `#`). */
  boundaryLineComment?: string;
  blockComment?: [string, string];
  quotes: string[];
  /** Quotes whose strings may span lines. Others stop at a newline. */
  multilineQuotes?: string;
  template?: boolean;
  tripleQuotes?: boolean;
  stringPrefix?: RegExp;
  identifier: RegExp;
  variable?: RegExp;
  signatures?: Signature[];
  jsx?: boolean;
  regex?: boolean;
  decorators?: boolean;
  phpTags?: boolean;
  /** Do not treat `obj.default` / `$obj->class` as keywords. */
  memberAccess?: string[];
}

type Push = (text: string, ...styles: StyleName[]) => void;

const NUMBER = /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/y;
const IDENT_CHAR = /[\w$\u0080-\uffff]/;

function matchAt(re: RegExp, text: string, index: number): string | null {
  re.lastIndex = index;
  const m = re.exec(text);
  return m && m.index === index && m[0] !== "" ? m[0] : null;
}

const MAX_TEMPLATE_NESTING = 4;

function scanClike(code: string, spec: CLike, outer: readonly StyleName[], out: Span[], nesting = 0): void {
  let i = 0;
  // What the last significant token was, for regex/JSX disambiguation.
  let prev: "start" | "operator" | "value" = "start";
  let lastMember = false;
  let signature: { style: StyleName; end: string; inclusive: boolean; depth: number } | null = null;

  const push: Push = (text, ...styles) => {
    if (text === "") return;
    const all: StyleName[] = [...outer];
    if (signature) all.push(signature.style);
    all.push(...styles);
    out.push({ text, styles: all });
  };

  const readQuoted = (start: number, quote: string, multiline: boolean): number => {
    let j = start + quote.length;
    while (j < code.length) {
      if (code[j] === "\\") {
        j += 2;
        continue;
      }
      if (code.startsWith(quote, j)) return j + quote.length;
      if (!multiline && code[j] === "\n") return j;
      j++;
    }
    return code.length;
  };

  while (i < code.length) {
    const ch = code[i]!;

    if (spec.phpTags) {
      const tag = matchAt(/<\?(?:php|=)?|\?>/y, code, i);
      if (tag) {
        push(tag, "meta");
        i += tag.length;
        prev = "start";
        continue;
      }
    }

    const lineComment = spec.lineComments.find((c) => code.startsWith(c, i));
    const boundaryComment =
      spec.boundaryLineComment && code.startsWith(spec.boundaryLineComment, i) && (i === 0 || /[\s;]/.test(code[i - 1]!));
    if (lineComment || boundaryComment) {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      push(code.slice(i, stop), "comment");
      i = stop;
      continue;
    }

    if (spec.blockComment && code.startsWith(spec.blockComment[0], i)) {
      const end = code.indexOf(spec.blockComment[1], i + spec.blockComment[0].length);
      const stop = end === -1 ? code.length : end + spec.blockComment[1].length;
      push(code.slice(i, stop), "comment");
      i = stop;
      continue;
    }

    // Strings, with an optional prefix (Python f"", r'', b"").
    const prefix = spec.stringPrefix ? matchAt(spec.stringPrefix, code, i) : null;
    const quoteStart = i + (prefix?.length ?? 0);
    const triple = spec.tripleQuotes ? ['"""', "'''"].find((q) => code.startsWith(q, quoteStart)) : undefined;
    const quote = triple ?? spec.quotes.find((q) => code.startsWith(q, quoteStart));
    if (quote && (prefix === null || !IDENT_CHAR.test(code[i - 1] ?? ""))) {
      if (quote === "`" && spec.template) {
        i = scanTemplate(code, i, spec, outer, signature?.style, out, nesting);
      } else {
        const multiline = triple !== undefined || (spec.multilineQuotes ?? "").includes(quote);
        const end = readQuoted(quoteStart, quote, multiline);
        push(code.slice(i, end), "string");
        i = end;
      }
      prev = "value";
      continue;
    }

    if (spec.regex && ch === "/" && prev !== "value") {
      const end = readRegex(code, i);
      if (end !== -1) {
        push(code.slice(i, end), "regexp");
        i = end;
        prev = "value";
        continue;
      }
    }

    if (spec.decorators && ch === "@") {
      const name = matchAt(/@[A-Za-z_][\w.]*/y, code, i);
      if (name && (i === 0 || !IDENT_CHAR.test(code[i - 1]!))) {
        push(name, "meta");
        i += name.length;
        prev = "operator";
        continue;
      }
    }

    // `</Name` is a closing tag wherever it appears; an opening `<Name` only where
    // an expression can start (so `a < b` and `Array<string>` stay operators).
    const closingTag = code[i + 1] === "/" && /[A-Za-z]/.test(code[i + 2] ?? "");
    if (spec.jsx && ch === "<" && (closingTag || (prev !== "value" && /[A-Za-z>]/.test(code[i + 1] ?? "")))) {
      const end = scanJsxTag(code, i, push);
      if (end !== -1) {
        i = end;
        prev = "operator";
        continue;
      }
    }

    if (spec.variable) {
      const variable = matchAt(spec.variable, code, i);
      if (variable) {
        push(variable);
        i += variable.length;
        prev = "value";
        continue;
      }
    }

    if (/[\d.]/.test(ch) && !IDENT_CHAR.test(code[i - 1] ?? "")) {
      const num = matchAt(NUMBER, code, i);
      if (num && /\d/.test(num) && !IDENT_CHAR.test(code[i + num.length] ?? "")) {
        push(num, "number");
        i += num.length;
        prev = "value";
        continue;
      }
    }

    const ident = matchAt(spec.identifier, code, i);
    if (ident) {
      const key = spec.caseInsensitive ? ident.toLowerCase() : ident;
      const isMember = lastMember;
      let style: StyleName | undefined;
      if (!isMember) {
        if (spec.keywords.has(key)) style = "keyword";
        else if (spec.literals.has(key)) style = "literal";
        else if (spec.builtIns.has(key)) style = "built_in";
        else if (spec.types?.has(key)) style = "type";
      }
      const opens: Signature | undefined = !isMember && !signature ? spec.signatures?.find((s) => s.keyword === key) : undefined;
      if (opens) signature = { style: opens.style, end: opens.end, inclusive: opens.inclusive, depth: 0 };
      if (style) push(ident, style);
      else push(ident);
      i += ident.length;
      prev = style === "keyword" ? "operator" : "value";
      lastMember = false;
      continue;
    }

    // Punctuation, operators and whitespace.
    if (signature) {
      if ("([{".includes(ch) && !(signature.depth === 0 && signature.end.includes(ch))) signature.depth++;
      else if (")]}".includes(ch) && signature.depth > 0) signature.depth--;
      else if (signature.depth === 0 && signature.end.includes(ch)) {
        if (signature.inclusive) {
          push(ch);
          signature = null;
          i++;
          prev = "operator";
          continue;
        }
        signature = null;
      }
    }
    const member = spec.memberAccess?.find((m) => code.startsWith(m, i));
    if (member) {
      push(member);
      i += member.length;
      lastMember = true;
      prev = "operator";
      continue;
    }
    push(ch);
    i++;
    if (!/\s/.test(ch)) {
      prev = ")]}".includes(ch) ? "value" : "operator";
      lastMember = false;
    }
  }
}

const MAX_REGEX_SCAN = 500;

function readRegex(code: string, start: number): number {
  let j = start + 1;
  let inClass = false;
  if (code[j] === "/" || code[j] === "*") return -1;
  // Bounded: every `/` that fails to close would otherwise rescan the rest of
  // its line, which is quadratic on one long hostile line.
  const limit = Math.min(code.length, start + MAX_REGEX_SCAN);
  while (j < limit) {
    const c = code[j]!;
    if (c === "\n") return -1;
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    else if (c === "/" && !inClass) {
      j++;
      while (j < code.length && /[a-z]/.test(code[j]!)) j++;
      return j;
    }
    j++;
  }
  return -1;
}

function scanTemplate(
  code: string,
  start: number,
  spec: CLike,
  outer: readonly StyleName[],
  signatureStyle: StyleName | undefined,
  out: Span[],
  nesting: number,
): number {
  const base: StyleName[] = [...outer];
  if (signatureStyle) base.push(signatureStyle);
  const stringStyles: StyleName[] = [...base, "string"];
  let j = start + 1;
  let literalStart = start;
  while (j < code.length) {
    const c = code[j]!;
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (c === "`") {
      j++;
      out.push({ text: code.slice(literalStart, j), styles: stringStyles });
      return j;
    }
    if (c === "$" && code[j + 1] === "{") {
      out.push({ text: code.slice(literalStart, j + 2), styles: stringStyles });
      let depth = 1;
      let k = j + 2;
      while (k < code.length && depth > 0) {
        if (code[k] === "{") depth++;
        else if (code[k] === "}") depth--;
        if (depth > 0) k++;
      }
      // Substitutions are highlighted as code, to a fixed depth: untrusted input
      // of nested `${` would otherwise recurse until the stack overflows.
      if (nesting < MAX_TEMPLATE_NESTING) scanClike(code.slice(j + 2, k), spec, stringStyles, out, nesting + 1);
      else out.push({ text: code.slice(j + 2, k), styles: stringStyles });
      literalStart = k;
      j = k + 1;
      continue;
    }
    j++;
  }
  out.push({ text: code.slice(literalStart), styles: stringStyles });
  return code.length;
}

/** `<Name attr="x">` / `</Name>` / `<>`. Returns the index after the tag, or -1. */
const MAX_TAG_SCAN = 1000;

function scanJsxTag(code: string, start: number, push: Push): number {
  const m = /<\/?([A-Za-z][\w.:-]*)?/y;
  m.lastIndex = start;
  const open = m.exec(code);
  if (!open) return -1;
  let j = start + open[0].length;
  const pieces: Array<[string, StyleName[]]> = [];
  const opener = open[0].slice(0, open[0].length - (open[1]?.length ?? 0));
  pieces.push([opener, ["tag"]]);
  if (open[1]) pieces.push([open[1], ["tag", "name"]]);
  while (j < code.length) {
    const c = code[j]!;
    if (c === ">") {
      pieces.push([">", ["tag"]]);
      j++;
      for (const [text, styles] of pieces) push(text, ...styles);
      return j;
    }
    // Bounded, so a long run of stray `<` in untrusted code cannot go quadratic.
    if (j - start > MAX_TAG_SCAN) return -1;
    if (c === '"' || c === "'") {
      const end = code.indexOf(c, j + 1);
      if (end === -1 || end - start > MAX_TAG_SCAN) return -1;
      pieces.push([code.slice(j, end + 1), ["tag", "string"]]);
      j = end + 1;
      continue;
    }
    const attr = /[A-Za-z_][\w:-]*/y;
    attr.lastIndex = j;
    const name = attr.exec(code);
    if (name) {
      pieces.push([name[0], ["tag", "attr"]]);
      j += name[0].length;
      continue;
    }
    if (c === "{") {
      let depth = 1;
      let k = j + 1;
      while (k < code.length && depth > 0) {
        if (code[k] === "{") depth++;
        else if (code[k] === "}") depth--;
        k++;
      }
      pieces.push([code.slice(j, k), ["tag"]]);
      j = k;
      continue;
    }
    if (!/[\s=/]/.test(c)) return -1;
    pieces.push([c, ["tag"]]);
    j++;
  }
  return -1;
}

const JS: CLike = {
  keywords: JS_KEYWORDS,
  literals: JS_LITERALS,
  builtIns: JS_BUILT_INS,
  lineComments: ["//"],
  blockComment: ["/*", "*/"],
  quotes: ["'", '"', "`"],
  template: true,
  identifier: /[A-Za-z_$][\w$]*/y,
  signatures: [
    { keyword: "function", style: "function", end: "{;", inclusive: false },
    { keyword: "class", style: "class", end: "{=", inclusive: false },
  ],
  jsx: true,
  regex: true,
  decorators: true,
  memberAccess: ["?.", "."],
};

const TS: CLike = {
  ...JS,
  keywords: TS_KEYWORDS,
  builtIns: TS_BUILT_INS,
  signatures: [...(JS.signatures ?? []), { keyword: "interface", style: "class", end: "{", inclusive: false }],
};

const PYTHON: CLike = {
  keywords: PY_KEYWORDS,
  literals: PY_LITERALS,
  builtIns: PY_BUILT_INS,
  lineComments: ["#"],
  quotes: ["'", '"'],
  tripleQuotes: true,
  stringPrefix: /[rRbBuUfF]{1,2}(?=['"])/y,
  identifier: /[A-Za-z_][\w]*/y,
  signatures: [
    { keyword: "def", style: "function", end: ":", inclusive: true },
    { keyword: "class", style: "class", end: ":", inclusive: true },
  ],
  decorators: true,
  memberAccess: ["."],
};

const PHP: CLike = {
  keywords: PHP_KEYWORDS,
  literals: PHP_LITERALS,
  builtIns: PHP_BUILT_INS,
  caseInsensitive: true,
  lineComments: ["//", "#"],
  blockComment: ["/*", "*/"],
  quotes: ["'", '"'],
  multilineQuotes: `'"`,
  identifier: /[A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*/y,
  variable: /\$+[A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*/y,
  signatures: [
    { keyword: "function", style: "function", end: "{;", inclusive: false },
    { keyword: "class", style: "class", end: "{", inclusive: false },
  ],
  phpTags: true,
  memberAccess: ["?->", "->", "::"],
};

const SHELL: CLike = {
  keywords: SH_KEYWORDS,
  literals: SH_LITERALS,
  builtIns: SH_BUILT_INS,
  lineComments: [],
  boundaryLineComment: "#",
  quotes: ["'", '"'],
  multilineQuotes: `'"`,
  identifier: /[A-Za-z_][\w.-]*/y,
  variable: /\$(?:\{[^}\n]*\}|[\w#@?$!*-]+)/y,
};

const SQL: CLike = {
  keywords: SQL_KEYWORDS,
  literals: SQL_LITERALS,
  builtIns: SQL_BUILT_INS,
  types: SQL_TYPES,
  caseInsensitive: true,
  lineComments: ["--"],
  blockComment: ["/*", "*/"],
  quotes: ["'"],
  identifier: /[A-Za-z_][\w$]*/y,
  memberAccess: ["."],
};

function clike(spec: CLike): (code: string) => Span[] {
  return (code) => {
    const out: Span[] = [];
    scanClike(code, spec, [], out);
    return out;
  };
}

function json(code: string): Span[] {
  const out: Span[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i]!;
    if (code.startsWith("//", i) || code.startsWith("/*", i)) {
      const block = code.startsWith("/*", i);
      const end = block ? code.indexOf("*/", i + 2) : code.indexOf("\n", i);
      const stop = end === -1 ? code.length : block ? end + 2 : end;
      out.push({ text: code.slice(i, stop), styles: ["comment"] });
      i = stop;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"' && code[j] !== "\n") j += code[j] === "\\" ? 2 : 1;
      j = Math.min(code.length, j + 1);
      let k = j;
      while (k < code.length && /\s/.test(code[k]!)) k++;
      const isKey = code[k] === ":";
      out.push({ text: code.slice(i, j), styles: [isKey ? "attr" : "string"] });
      i = j;
      continue;
    }
    const num = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    num.lastIndex = i;
    const n = num.exec(code);
    if (n && (i === 0 || !/[\w.]/.test(code[i - 1]!))) {
      out.push({ text: n[0], styles: ["number"] });
      i += n[0].length;
      continue;
    }
    const lit = /true|false|null/y;
    lit.lastIndex = i;
    const l = lit.exec(code);
    if (l && !/\w/.test(code[i + l[0].length] ?? "")) {
      out.push({ text: l[0], styles: ["literal"] });
      i += l[0].length;
      continue;
    }
    out.push({ text: ch, styles: [] });
    i++;
  }
  return out;
}

function yamlScalar(text: string, out: Span[]): void {
  // Split off leading/trailing whitespace so only the value itself is coloured.
  // Plain trims, not a regex: `(.*?)(\s*)$` backtracks quadratically on whitespace.
  const lead = text.length - text.trimStart().length;
  const value = text.trim();
  const trail = text.slice(lead + value.length);
  out.push({ text: text.slice(0, lead), styles: [] });
  if (value !== "") {
    let style: StyleName = "string";
    if (/^(?:true|false|yes|no|null|~)$/i.test(value)) style = "literal";
    else if (/^[-+]?(?:\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?|0x[\da-fA-F]+)$/.test(value)) style = "number";
    else if (/^[|>][-+]?$/.test(value)) style = "meta";
    out.push({ text: value, styles: [style] });
  }
  out.push({ text: trail, styles: [] });
}

function yaml(code: string): Span[] {
  const out: Span[] = [];
  code.split("\n").forEach((line, index) => {
    if (index > 0) out.push({ text: "\n", styles: [] });
    let rest = line;
    // Comment: a `#` at the start or after whitespace, outside quotes.
    let comment = "";
    let quote: string | null = null;
    for (let i = 0; i < rest.length; i++) {
      const c = rest[i]!;
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "#" && (i === 0 || /\s/.test(rest[i - 1]!))) {
        comment = rest.slice(i);
        rest = rest.slice(0, i);
        break;
      }
    }
    if (/^(?:---|\.\.\.)\s*$/.test(rest)) {
      out.push({ text: rest, styles: ["meta"] });
    } else {
      const key = /^(\s*(?:-\s+)?)((?:"[^"]*"|'[^']*'|[^\s:#"'][^:#]*):)(?=\s|$)/.exec(rest);
      let value = rest;
      if (key) {
        out.push({ text: key[1]!, styles: [] });
        out.push({ text: key[2]!, styles: ["attr"] });
        value = rest.slice(key[0].length);
      } else {
        const bullet = /^(\s*-\s+)/.exec(rest);
        if (bullet) {
          out.push({ text: bullet[1]!, styles: [] });
          value = rest.slice(bullet[1]!.length);
        }
      }
      // Flow collections: colour each element, keep the punctuation plain.
      for (const part of value.split(/([[\]{},])/)) {
        if (part === "") continue;
        if (/^[[\]{},]$/.test(part)) out.push({ text: part, styles: [] });
        else yamlScalar(part, out);
      }
    }
    if (comment) out.push({ text: comment, styles: ["comment"] });
  });
  return out;
}

function diff(code: string): Span[] {
  const out: Span[] = [];
  code.split("\n").forEach((line, index) => {
    if (index > 0) out.push({ text: "\n", styles: [] });
    let style: StyleName | undefined;
    if (/^(?:---|\+\+\+|Index: |index |diff --git|={3,}|\*{3} )/.test(line)) style = "comment";
    else if (/^@@/.test(line)) style = "meta";
    else if (/^[-<]/.test(line)) style = "deletion";
    else if (/^[+>!]/.test(line)) style = "addition";
    out.push({ text: line, styles: style ? [style] : [] });
  });
  return out;
}

const LEXERS: Record<string, (code: string) => Span[]> = {};
const register = (names: string, lexer: (code: string) => Span[]) => {
  for (const name of names.split(" ")) LEXERS[name] = lexer;
};
register("js javascript jsx mjs cjs node", clike(JS));
register("ts typescript tsx mts cts", clike(TS));
register("py python python3 py3", clike(PYTHON));
register("php php8", clike(PHP));
register("sh bash zsh shell console shellscript", clike(SHELL));
register("sql mysql pgsql postgres postgresql sqlite", clike(SQL));
register("json jsonc json5", json);
register("yaml yml", yaml);
register("diff patch", diff);

/** Languages with a first-party lexer, by every accepted fence name. */
export const HIGHLIGHT_LANGUAGES: readonly string[] = Object.keys(LEXERS);

/**
 * Tokenise `code` for display. Unsupported or absent languages come back as one
 * unstyled span, so callers never need a second code path.
 */
export function highlightCode(code: string, language: string | undefined): Span[] {
  const name = (language ?? "").trim().split(/\s+/)[0]!.toLowerCase();
  const lexer = LEXERS[name];
  if (!lexer || code === "") return code === "" ? [] : [{ text: code, styles: [] }];
  return lexer(code);
}
