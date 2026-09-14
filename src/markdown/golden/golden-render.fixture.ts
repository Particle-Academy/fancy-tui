/**
 * Child-process half of `golden.test.ts`.
 *
 * Renders every golden case through the PUBLIC `renderMarkdown` and prints the
 * results as JSON. It runs in its own process because colour support is decided
 * from the environment when chalk loads — the only honest way to exercise what a
 * consumer gets under `FORCE_COLOR=0` versus a colour terminal is to start a
 * process with that environment, not to poke a level into a shared instance.
 */
import { renderMarkdown } from "../render.js";
import { MARKED_TERMINAL_GOLDEN } from "./golden.js";

const out: Record<string, string> = {};
for (const golden of MARKED_TERMINAL_GOLDEN) out[golden.name] = renderMarkdown(golden.source);
process.stdout.write(JSON.stringify(out));
