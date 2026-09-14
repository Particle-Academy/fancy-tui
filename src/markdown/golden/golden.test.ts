import { it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readAnsi, visibleAnsi } from "./ansi-screen.js";
import { INTENTIONAL_DIFFERENCES } from "./differences.js";
import { MARKED_TERMINAL_GOLDEN } from "./golden.js";

type Mode = "plain" | "color" | "hyperlink";

const ENV: Record<Mode, Record<string, string>> = {
  plain: { FORCE_COLOR: "0", FORCE_HYPERLINK: "0" },
  color: { FORCE_COLOR: "3", FORCE_HYPERLINK: "0" },
  hyperlink: { FORCE_COLOR: "3", FORCE_HYPERLINK: "1" },
};

const rendered = new Map<Mode, Record<string, string>>();

/** Render the corpus through the PUBLIC renderMarkdown in a process with this environment. */
function renderAll(mode: Mode): Record<string, string> {
  const cached = rendered.get(mode);
  if (cached) return cached;
  const env: Record<string, string | undefined> = { ...process.env, ...ENV[mode] };
  delete env.NO_COLOR;
  const script = fileURLToPath(new URL("./golden-render.fixture.js", import.meta.url));
  const result = spawnSync(process.execPath, [script], { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  const out = JSON.parse(result.stdout) as Record<string, string>;
  rendered.set(mode, out);
  return out;
}

it("renders the golden corpus in plain text exactly as marked-terminal did, apart from documented differences", () => {
  const out = renderAll("plain");
  for (const golden of MARKED_TERMINAL_GOLDEN) {
    const expected = INTENTIONAL_DIFFERENCES[golden.name]?.plain ?? golden.plain;
    assert.equal(out[golden.name], expected, golden.name);
  }
});

it("renders the golden corpus in colour so it looks as marked-terminal's did, apart from documented differences", () => {
  const out = renderAll("color");
  for (const golden of MARKED_TERMINAL_GOLDEN) {
    const expected = INTENTIONAL_DIFFERENCES[golden.name]?.color ?? golden.color;
    assert.equal(visibleAnsi(out[golden.name]!), visibleAnsi(expected), golden.name);
  }
});

it("colour output is the plain output plus SGR sequences and nothing else", () => {
  const plain = renderAll("plain");
  const color = renderAll("color");
  const sgr = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, "g");
  for (const golden of MARKED_TERMINAL_GOLDEN) {
    assert.equal(color[golden.name]!.replace(sgr, ""), plain[golden.name], golden.name);
  }
});

it("emits only complete SGR sequences, with every style closed before the line ends", () => {
  // A style left open across "\n" breaks any consumer that renders lines on
  // their own — DocumentViewer's scroll window does exactly that.
  const out = renderAll("color");
  for (const golden of MARKED_TERMINAL_GOLDEN) {
    const screen = readAnsi(out[golden.name]!);
    assert.deepEqual(screen.errors, [], `${golden.name}: malformed escapes`);
    assert.deepEqual(screen.unbalancedLines, [], `${golden.name}: style still open at end of line`);
  }
});

it("never emits OSC 8 hyperlinks, even when the terminal advertises support", () => {
  const color = renderAll("color");
  const hyperlink = renderAll("hyperlink");
  for (const golden of MARKED_TERMINAL_GOLDEN) {
    assert.equal(hyperlink[golden.name], color[golden.name], golden.name);
    assert.deepEqual(readAnsi(hyperlink[golden.name]!).hyperlinks, [], golden.name);
  }
  // The case that motivates it: the label names one site, the link opens another.
  assert.match(hyperlink["link-spoof"]!, /https:\/\/evil\.example\/login/);
});

it("documents only differences that still exist", () => {
  const names = new Set(MARKED_TERMINAL_GOLDEN.map((g) => g.name));
  for (const [name, difference] of Object.entries(INTENTIONAL_DIFFERENCES)) {
    const golden = MARKED_TERMINAL_GOLDEN.find((g) => g.name === name);
    assert.ok(names.has(name) && golden, `${name} is not a golden case`);
    assert.ok(difference.reason.length > 20, `${name} needs a reason`);
    assert.ok(difference.plain !== undefined || difference.color !== undefined, `${name} records no new output`);
    if (difference.plain !== undefined) assert.notEqual(difference.plain, golden.plain, `${name}: plain override matches marked-terminal`);
    if (difference.color !== undefined) {
      assert.notEqual(visibleAnsi(difference.color), visibleAnsi(golden.color), `${name}: colour override looks like marked-terminal`);
    }
  }
});
