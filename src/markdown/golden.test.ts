import { it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MARKED_TERMINAL_GOLDEN } from "./golden.js";

type Mode = "plain" | "color" | "hyperlink";

const ENV: Record<Mode, Record<string, string>> = {
  plain: { FORCE_COLOR: "0", FORCE_HYPERLINK: "0" },
  color: { FORCE_COLOR: "3", FORCE_HYPERLINK: "0" },
  hyperlink: { FORCE_COLOR: "3", FORCE_HYPERLINK: "1" },
};

function renderAll(mode: Mode): Record<string, string> {
  const env: Record<string, string | undefined> = { ...process.env, ...ENV[mode] };
  delete env.NO_COLOR;
  const script = fileURLToPath(new URL("./golden-render.fixture.js", import.meta.url));
  const result = spawnSync(process.execPath, [script], { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as Record<string, string>;
}

for (const mode of ["plain", "color", "hyperlink"] as const) {
  it(`reproduces marked-terminal's ${mode} output for the golden corpus`, () => {
    const rendered = renderAll(mode);
    for (const golden of MARKED_TERMINAL_GOLDEN) {
      const expected = mode === "hyperlink" ? (golden.hyperlink ?? golden.color) : golden[mode];
      assert.equal(rendered[golden.name], expected, `${golden.name} (${mode})`);
    }
  });
}
