import { it } from "node:test";
import assert from "node:assert/strict";
import stringWidth from "string-width";
import { renderMarkdown } from "./render.js";
import { MARKED_TERMINAL_GOLDEN } from "./golden/golden.js";

// Colour depends on the environment the suite runs in; width does not.
const SGR = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, "g");
const lines = (markdown: string) => renderMarkdown(markdown).replace(SGR, "").split("\n");
const graphemes = (text: string) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);

it("wraps prose at 80 terminal columns, counting wide characters as two", () => {
  // Code blocks and tables are never wrapped; everything else is prose.
  const prose = MARKED_TERMINAL_GOLDEN.filter((g) => !/^(code|table|html)/.test(g.name) && !g.source.includes("```") && !g.source.includes("|"));
  assert.ok(prose.length > 50);
  for (const golden of prose) {
    for (const line of lines(golden.source)) {
      assert.ok(stringWidth(line) <= 80, `${golden.name}: ${stringWidth(line)} columns: ${JSON.stringify(line)}`);
    }
  }
});

it("cuts a run of CJK characters at exactly 80 columns", () => {
  assert.deepEqual(lines("漢".repeat(100)), ["漢".repeat(40), "漢".repeat(40), "漢".repeat(20)]);
});

it("moves a CJK word that does not fit to the next line instead of overflowing", () => {
  const out = lines(`${"a".repeat(75)} 漢字漢字`);
  assert.deepEqual(out, ["a".repeat(75), "漢字漢字"]);
});

it("never cuts inside a grapheme cluster", () => {
  // Built from code points so this file carries no invisible joiners of its own.
  const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467); // man-woman-girl
  const accented = String.fromCodePoint(0x65, 0x301); // "e" + COMBINING ACUTE ACCENT
  // The leading "x" moves the cut point off a multiple of the cluster's UTF-16
  // length — which is exactly where a code-unit cut lands inside a cluster.
  for (const cluster of [family, accented]) {
    const out = lines(`x${cluster.repeat(100)}`);
    assert.ok(out.length > 1, "expected the run to wrap");
    out.forEach((line, i) => {
      assert.equal(line.replace(/^x/, "").replaceAll(cluster, ""), "", `line ${i + 1} splits a cluster: ${JSON.stringify(line)}`);
      assert.ok(stringWidth(line) <= 80);
    });
  }
});

it("keeps every character when wrapping, in order", () => {
  const source = "これは非常に長い日本語の文章で、🚀 and ASCII words mixed in, 端末の幅を超えて折り返されるかどうか".repeat(4);
  const out = lines(source).join("");
  assert.deepEqual(graphemes(out.replace(/\s/g, "")), graphemes(source.replace(/\s/g, "")));
});

it("wraps list items under their text, inside the width", () => {
  const out = lines(`- ${"word ".repeat(40)}\n10. ${"word ".repeat(40)}`);
  assert.ok(out.length >= 4);
  for (const line of out) assert.ok(stringWidth(line) <= 80, JSON.stringify(line));
  assert.match(out[0]!, /^ {2}\* word/);
  assert.match(out[1]!, /^ {4}word/);
  // A list that starts at 10 keeps its number, and continues under "10. ".
  const ordered = out.findIndex((l) => l.startsWith("  10. word"));
  assert.ok(ordered > 0);
  assert.match(out[ordered + 1]!, /^ {6}word/);
});

it("draws table columns to the terminal width of their widest cell", () => {
  const out = lines("| 名前 | x |\n| --- | --- |\n| ビルド | 🚀 |");
  const widths = out.map((line) => stringWidth(line));
  assert.ok(widths.every((w) => w === widths[0]), `ragged table: ${widths.join(", ")}`);
});
