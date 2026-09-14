/**
 * Where the first-party renderer deliberately differs from marked-terminal.
 *
 * `golden.ts` holds what marked-terminal produced; this file holds the cases
 * where fancy-tui now renders something else, WHY, and the new output. A case
 * absent from here must render exactly as marked-terminal did — plain output
 * byte for byte, coloured output cell for cell (see `ansi-screen.ts`).
 *
 * `plain` / `color` are present only for the mode that changed. Colour is
 * compared by what it looks like, not by bytes: marked-terminal wrapped every
 * paragraph in redundant resets that no terminal displays.
 *
 * One difference applies to every link and is tested on its own rather than
 * listed per case: fancy-tui never emits OSC 8 hyperlinks. marked-terminal did
 * whenever the terminal advertised support, and an OSC 8 link shows only its
 * label — so `[https://bank.example](https://evil.example)` read as the bank.
 * Links always print `label (url)` now, in every terminal.
 */
export interface IntentionalDifference {
  reason: string;
  plain?: string;
  color?: string;
}

export const INTENTIONAL_DIFFERENCES: Readonly<Record<string, IntentionalDifference>> = {
  "image": {
    reason: "A standalone image no longer ends in a trailing space (marked-terminal's image renderer returned a newline that reflow turned into a space).",
    plain: "![Alt text – A title](https://example.com/a.png)\n\n![no title](b.png)",
    color: "![Alt text – A title](https://example.com/a.png)\n\n![no title](b.png)",
  },
  "list-ordered-start": {
    reason: "An ordered list starts at its first number. marked-terminal renumbered every ordered list from 1.",
    plain: "  3. three\n  4. four\n  5. five",
    color: "  3. three\n  4. four\n  5. five",
  },
  "list-nested-unordered": {
    reason: "Colour output no longer shows blank lines between an item and its nested content. marked-terminal's per-line resets made those blank lines non-empty, so they were only removed when colour was off.",
    color: "  * parent\n    * child\n      * grandchild\n    * child two\n  * parent two",
  },
  "list-nested-mixed": {
    reason: "Every list numbers its own items. marked-terminal counted nested bullets into the outer list's numbering (`* detail a`, `2. detail b`, `3. next step`). Colour output no longer shows blank lines between an item and its nested content. marked-terminal's per-line resets made those blank lines non-empty, so they were only removed when colour was off.",
    plain: "  1. step\n    * detail a\n    * detail b\n  2. next step\n    1. sub one\n    2. sub two",
    color: "  1. step\n    * detail a\n    * detail b\n  2. next step\n    1. sub one\n    2. sub two",
  },
  "list-inline-formatting": {
    reason: "Bold, code and links inside tight list items are rendered. marked-terminal printed their raw markdown (`**bold**`, `` `code` ``, `[link](url)`).",
    plain: "  * bold item\n  * item with code\n  * link (https://example.com)",
    color: "  * \u001b[1mbold\u001b[22m item\n  * item with \u001b[33mcode\u001b[39m\n  * \u001b[34mlink (\u001b[39m\u001b[34m\u001b[34m\u001b[4mhttps://example.com\u001b[24m\u001b[39m\u001b[34m\u001b[39m\u001b[34m)\u001b[39m",
  },
  "list-loose-multi-paragraph": {
    reason: "Colour output no longer shows blank lines between an item and its nested content. marked-terminal's per-line resets made those blank lines non-empty, so they were only removed when colour was off.",
    color: "  1. para one\n     para one continued\n  2. para two",
  },
  "list-task": {
    reason: "One space after a task checkbox. marked-terminal printed two (`[X]  done task`).",
    plain: "  * [X] done task\n  * [ ] open task\n  * plain item",
    color: "  * [X] done task\n  * [ ] open task\n  * plain item",
  },
  "list-with-code": {
    reason: "Colour output no longer shows blank lines between an item and its nested content. marked-terminal's per-line resets made those blank lines non-empty, so they were only removed when colour was off.",
    color: "  * install:\n      npm i\n  * run",
  },
  "list-long-item": {
    reason: "A long list item wraps at the width, continuing under the item's text. marked-terminal never wrapped tight list items.",
    plain: "  * The quick brown fox jumps over the lazy dog while the build pipeline keeps\n    running every single test in the suite again.\n  * short",
    color: "  * The quick brown fox jumps over the lazy dog while the build pipeline keeps\n    running every single test in the suite again.\n  * short",
  },
  "blockquote": {
    reason: "Quoted text is gray italic, as marked-terminal intended. Its paragraph renderer wrapped text in a full reset (ESC[0m) that cancelled the quote's style, so only wrapped continuation lines were ever styled.",
    color: "\u001b[90m\u001b[3m  quoted text continues here\u001b[23m\u001b[39m",
  },
  "blockquote-nested": {
    reason: "Quoted text is gray italic, as marked-terminal intended. Its paragraph renderer wrapped text in a full reset (ESC[0m) that cancelled the quote's style, so only wrapped continuation lines were ever styled.",
    color: "\u001b[90m\u001b[3m  outer\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\u001b[90m\u001b[3m\u001b[90m\u001b[3m  inner\u001b[23m\u001b[3m\u001b[39m\u001b[90m\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  back to outer\u001b[23m\u001b[39m",
  },
  "blockquote-with-list": {
    reason: "A list inside a blockquote keeps its indent on the first item. marked-terminal trimmed the quote body, pulling the first bullet two columns left of the others. Quoted text is gray italic, as marked-terminal intended. Its paragraph renderer wrapped text in a full reset (ESC[0m) that cancelled the quote's style, so only wrapped continuation lines were ever styled.",
    plain: "    * one\n    * two\n  \n  bold in quote",
    color: "\u001b[90m\u001b[3m    * one\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m    * two\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\u001b[90m\u001b[3m\u001b[1mbold\u001b[22m\u001b[23m\u001b[39m\u001b[90m\u001b[3m in quote\u001b[23m\u001b[39m",
  },
  "blockquote-long": {
    reason: "Quoted text is gray italic, as marked-terminal intended. Its paragraph renderer wrapped text in a full reset (ESC[0m) that cancelled the quote's style, so only wrapped continuation lines were ever styled.",
    color: "\u001b[90m\u001b[3m  The quick brown fox jumps over the lazy dog while the build pipeline keeps\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  running every single test in the suite again.\u001b[23m\u001b[39m",
  },
  "code-php": {
    reason: "First-party highlighting: a return type after the parameters (`: int`) is coloured as a keyword; highlight.js left it in the signature colour.",
    color: "  \u001b[90m<?php\u001b[39m\n  \u001b[33mfunction add(\u001b[39m\u001b[33m\u001b[34mint\u001b[39m\u001b[33m\u001b[39m\u001b[33m $a, \u001b[39m\u001b[33m\u001b[34mint\u001b[39m\u001b[33m\u001b[39m\u001b[33m $b): \u001b[39m\u001b[33m\u001b[34mint\u001b[39m\u001b[33m\u001b[39m\u001b[33m \u001b[39m{ \u001b[34mreturn\u001b[39m $a + $b; } \u001b[32m// sum\u001b[39m\n  $x = \u001b[34mnew\u001b[39m Foo(\u001b[31m'bar'\u001b[39m);",
  },
  "code-rust": {
    reason: "Rust has no first-party lexer, so the block renders uncoloured (see HIGHLIGHT_LANGUAGES).",
    color: "  fn main() { let x: i32 = 5; println!(\"{}\", x); }",
  },
  "code-no-lang": {
    reason: "A code block without a language renders uncoloured. highlight.js guessed a language and coloured ordinary words (`with`, `code`, `second`) as keywords.",
    color: "  plain fenced block\n  with two lines",
  },
  "code-unknown-lang": {
    reason: "A code block in a language with no lexer renders uncoloured. marked-terminal painted it entirely yellow.",
    color: "  const x = 1;",
  },
  "code-indented": {
    reason: "A code block without a language renders uncoloured. highlight.js guessed a language and coloured ordinary words (`with`, `code`, `second`) as keywords.",
    color: "Para.\n\n  indented code\n  second line",
  },
  "code-tabs": {
    reason: "A code block without a language renders uncoloured. highlight.js guessed a language and coloured ordinary words (`with`, `code`, `second`) as keywords.",
    color: "  \tindented with tab",
  },
  "table-align": {
    reason: "Column alignment from the delimiter row (`:---:`, `---:`) is honoured. marked-terminal left-aligned every cell.",
    plain: "┌─────────────┬────────┬───────┐\n│ Left        │ Center │ Right │\n├─────────────┼────────┼───────┤\n│ a           │   b    │     c │\n├─────────────┼────────┼───────┤\n│ longer cell │  mid   │     1 │\n└─────────────┴────────┴───────┘",
    color: "\u001b[90m┌─────────────┬────────┬───────┐\u001b[39m\n\u001b[90m│\u001b[39m\u001b[31m Left        \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Center \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Right \u001b[39m\u001b[90m│\u001b[39m\n\u001b[90m├─────────────┼────────┼───────┤\u001b[39m\n\u001b[90m│\u001b[39m a           \u001b[90m│\u001b[39m   b    \u001b[90m│\u001b[39m     c \u001b[90m│\u001b[39m\n\u001b[90m├─────────────┼────────┼───────┤\u001b[39m\n\u001b[90m│\u001b[39m longer cell \u001b[90m│\u001b[39m  mid   \u001b[90m│\u001b[39m     1 \u001b[90m│\u001b[39m\n\u001b[90m└─────────────┴────────┴───────┘\u001b[39m",
  },
  "unicode-cjk-long": {
    reason: "Wrapping measures terminal columns, so CJK characters count as two and a long run is cut at 80 columns. marked-terminal counted UTF-16 code units. This line was 138 columns wide.",
    plain: "これは非常に長い日本語の文章で、端末の幅を超えて折り返されるかどうかを確認するた\nめのものです。さらに文章を続けて八十列を確実に超えるようにします。",
    color: "これは非常に長い日本語の文章で、端末の幅を超えて折り返されるかどうかを確認するた\nめのものです。さらに文章を続けて八十列を確実に超えるようにします。",
  },
  "unicode-cjk-mixed-wrap": {
    reason: "Wrapping measures terminal columns, so CJK characters count as two and a long run is cut at 80 columns. marked-terminal counted UTF-16 code units. The first line was 88 columns wide.",
    plain: "Mixed 中文 text with English words and 汉字 repeated 汉字汉字汉字汉字 across the\nboundary of eighty columns 汉字汉字汉字.",
    color: "Mixed 中文 text with English words and 汉字 repeated 汉字汉字汉字汉字 across the\nboundary of eighty columns 汉字汉字汉字.",
  },
  "unicode-emoji-shortcode": {
    reason: "Emoji shortcodes (`:rocket:`) are printed as written. The name table came from node-emoji, a dependency of marked-terminal; write the Unicode character instead.",
    plain: "Ship it :rocket: then :white_check_mark: and :not_an_emoji: and 10:30:45.",
    color: "Ship it :rocket: then :white_check_mark: and :not_an_emoji: and 10:30:45.",
  },
  "agent-reply": {
    reason: "An ordered list interrupted by a code block keeps counting (`2.`), inline code inside the list item is rendered, and the blockquote is styled.",
    plain: "## Summary\n\nThe build failed because tsconfig.json is missing baseUrl.\n\n  1. Add it:\n\n  { \"compilerOptions\": { \"baseUrl\": \".\" } }\n\n  2. Re-run npm test.\n\n  Note: this only affects path aliases.\n\n┌───────┬────────┐\n│ Check │ Result │\n├───────┼────────┤\n│ tsc   │ ❌     │\n├───────┼────────┤\n│ lint  │ ✅     │\n└───────┴────────┘",
    color: "\u001b[32m\u001b[1m## Summary\u001b[22m\u001b[39m\n\nThe build failed because \u001b[33mtsconfig.json\u001b[39m is missing \u001b[1mbaseUrl\u001b[22m.\n\n  1. Add it:\n\n  { \u001b[36m\"compilerOptions\"\u001b[39m: { \u001b[36m\"baseUrl\"\u001b[39m: \u001b[31m\".\"\u001b[39m } }\n\n  2. Re-run \u001b[33mnpm test\u001b[39m.\n\n\u001b[90m\u001b[3m  Note: this only affects path aliases.\u001b[23m\u001b[39m\n\n\u001b[90m┌───────┬────────┐\u001b[39m\n\u001b[90m│\u001b[39m\u001b[31m Check \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Result \u001b[39m\u001b[90m│\u001b[39m\n\u001b[90m├───────┼────────┤\u001b[39m\n\u001b[90m│\u001b[39m tsc   \u001b[90m│\u001b[39m ❌     \u001b[90m│\u001b[39m\n\u001b[90m├───────┼────────┤\u001b[39m\n\u001b[90m│\u001b[39m lint  \u001b[90m│\u001b[39m ✅     \u001b[90m│\u001b[39m\n\u001b[90m└───────┴────────┘\u001b[39m",
  },
  "entities-in-code": {
    reason: "Code spans are literal, so `` `&amp;` `` shows `&amp;`. marked-terminal decoded entities inside code too. Entities in text and link destinations are still decoded.",
    plain: "&amp; and a & b (https://x.dev/?a=1&b=2)",
    color: "\u001b[33m&amp;\u001b[39m and \u001b[34ma & b (\u001b[39m\u001b[34m\u001b[34m\u001b[4mhttps://x.dev/?a=1&b=2\u001b[24m\u001b[39m\u001b[34m\u001b[39m\u001b[34m)\u001b[39m",
  },
  "blockquote-with-code": {
    reason: "A code block inside a blockquote keeps its indent. marked-terminal trimmed it off the first line. Quoted text is gray italic, as marked-terminal intended. Its paragraph renderer wrapped text in a full reset (ESC[0m) that cancelled the quote's style, so only wrapped continuation lines were ever styled.",
    plain: "    const a = 1;\n  \n  after",
    color: "\u001b[90m\u001b[3m    \u001b[23m\u001b[39m\u001b[90m\u001b[3m\u001b[34mconst\u001b[39m\u001b[90m\u001b[23m\u001b[39m\u001b[90m\u001b[3m a = \u001b[23m\u001b[39m\u001b[90m\u001b[3m\u001b[32m1\u001b[39m\u001b[90m\u001b[23m\u001b[39m\u001b[90m\u001b[3m;\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  after\u001b[23m\u001b[39m",
  },
  "list-item-wrapped-nested": {
    reason: "A soft line break inside a tight list item reflows like any other text, because list items now wrap.",
    plain: "  * parent item continued lazily\n    * child",
    color: "  * parent item continued lazily\n    * child",
  },
  "image-in-paragraph": {
    reason: "Colour output no longer puts two spaces after an inline image.",
    color: "Before ![icon](i.png) after.",
  },
};
