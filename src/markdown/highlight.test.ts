import { it } from "node:test";
import assert from "node:assert/strict";
import { HIGHLIGHT_LANGUAGES, highlightCode } from "./highlight.js";
import type { Span, StyleName } from "./spans.js";

const styleOf = (spans: Span[], text: string): readonly StyleName[] | undefined => spans.find((s) => s.text === text)?.styles;

it("partitions the input exactly — highlighting never adds or drops a character", () => {
  const samples = [
    "const a = `x ${b + `y ${c}`} z`; // done",
    'function f(a: { b: number }): void { return /re[/]x/g.test("s"); }',
    "<Box id=\"a\" on={() => 1}>hi</Box>",
    "def f(x: dict[str, int] = {}) -> None:\n    return f'''{x}'''",
    "<?php $x = fn($a) => $a->class ?? 'y'; # c\n?>",
    "echo \"$HOME\" ${X:-y} # comment\nif [ -f x ]; then exit 1; fi",
    "SELECT \"x\", 'y' FROM t -- c\n/* b */",
    "key: value # c\n- item: [a, 'b', 3]\n---",
    "--- a\n+++ b\n@@ -1 +1 @@\n-x\n+y",
    '{ "a": [1, -2.5e3, true, null], // c\n "b": "c" }',
    "unterminated \"string\n`template ${ never closed",
    "",
    "   ",
  ];
  for (const language of HIGHLIGHT_LANGUAGES) {
    for (const code of samples) {
      assert.equal(highlightCode(code, language).map((s) => s.text).join(""), code, `${language}: ${JSON.stringify(code)}`);
    }
  }
});

it("returns one unstyled span for languages it does not lex, or none", () => {
  for (const language of [undefined, "", "text", "rust", "notalanguage"]) {
    assert.deepEqual(highlightCode("fn main() {}", language), [{ text: "fn main() {}", styles: [] }]);
  }
});

it("accepts fence info strings with extra words and any case", () => {
  assert.deepEqual(styleOf(highlightCode("const x", "TS title=a.ts"), "const"), ["keyword"]);
});

it("classifies TypeScript the way highlight.js coloured it", () => {
  const spans = highlightCode('import { x } from "./x.js";\n// c\nexport const n: number = 0x1f;', "ts");
  assert.deepEqual(styleOf(spans, "import"), ["keyword"]);
  assert.deepEqual(styleOf(spans, '"./x.js"'), ["string"]);
  assert.deepEqual(styleOf(spans, "// c"), ["comment"]);
  assert.deepEqual(styleOf(spans, "number"), ["built_in"]);
  assert.deepEqual(styleOf(spans, "0x1f"), ["number"]);
});

it("colours a function signature up to its body, with keywords inside it", () => {
  const spans = highlightCode("function add(a: number) { return a; }", "ts");
  assert.deepEqual(styleOf(spans, "function"), ["function", "keyword"]);
  assert.deepEqual(styleOf(spans, "number"), ["function", "built_in"]);
  assert.deepEqual(styleOf(spans, "return"), ["keyword"]);
});

it("ends a Python signature at its colon, including it", () => {
  const spans = highlightCode("def f(a: int) -> str:\n    pass", "python");
  const colon = spans.filter((s) => s.text === ":");
  assert.deepEqual(colon.at(-1)?.styles, ["function"]);
  assert.deepEqual(styleOf(spans, "pass"), ["keyword"]);
});

it("tells JSX tags from comparisons and generics", () => {
  const jsx = highlightCode("return <Box id=\"a\">hi</Box>;", "tsx");
  assert.deepEqual(styleOf(jsx, "Box"), ["tag", "name"]);
  assert.equal(jsx.filter((s) => s.text === "Box").length, 2, "closing tag after text is a tag too");
  const compare = highlightCode("if (a < b) { f<string>(x); }", "tsx");
  assert.equal(compare.some((s) => s.styles.includes("tag")), false);
});

it("does not treat property names as keywords", () => {
  assert.deepEqual(styleOf(highlightCode("obj.default", "js"), "default"), []);
  assert.deepEqual(styleOf(highlightCode("$this->class", "php"), "class"), []);
});

it("colours YAML keys, scalars and comments", () => {
  const spans = highlightCode("name: ci # c\ncount: 3\nok: true", "yaml");
  assert.deepEqual(styleOf(spans, "name:"), ["attr"]);
  assert.deepEqual(styleOf(spans, "ci"), ["string"]);
  assert.deepEqual(styleOf(spans, "# c"), ["comment"]);
  assert.deepEqual(styleOf(spans, "3"), ["number"]);
  assert.deepEqual(styleOf(spans, "true"), ["literal"]);
});

it("survives hostile input without deep recursion or quadratic time", () => {
  const started = Date.now();
  for (const [code, language] of [
    ["`${".repeat(20000), "js"],
    ["<a ".repeat(20000), "tsx"],
    ['<a "'.repeat(20000), "tsx"],
    [`${" ".repeat(100000)}x`, "yaml"],
    ['"a" '.repeat(20000), "json"],
    ["(/".repeat(20000), "js"],
    ["(/[".repeat(30000), "js"],
  ] as const) {
    assert.equal(highlightCode(code, language).map((s) => s.text).join("").length, code.length);
  }
  assert.ok(Date.now() - started < 5000, `took ${Date.now() - started}ms`);
});
