import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";

// marked-terminal's DefinitelyTyped signature still models the pre-token
// renderer API although v7 supports marked 15 at runtime.
const parser = new Marked();
parser.use(markedTerminal({ reflowText: true, tab: 2 }) as never);

export function renderMarkdown(source: string): string {
  const safe = source.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001A\u001C-\u001F\u007F]/g, "");
  const result = parser.parse(safe);
  return String(result).trimEnd();
}
