/**
 * marked-terminal's ACTUAL output for a representative markdown corpus.
 *
 * Captured on 2026-09-13 through the public `renderMarkdown`, BEFORE the
 * renderer was replaced, from the exact tree fancy-tui 0.10.0 shipped:
 * marked-terminal 7.3.0, marked 15.0.12, cli-highlight 2.1.11 (highlight.js
 * 10.7.3), cli-table3 0.6.5, node-emoji 2.2.0, chalk 5, with the options
 * fancy-tui passed (`reflowText: true, tab: 2`, so width 80).
 *
 * Three environments, because marked-terminal's output depended on them:
 *
 * - `plain`     — FORCE_COLOR=0 (chalk level 0, no highlighting)
 * - `color`     — FORCE_COLOR=3, FORCE_HYPERLINK=0
 * - `hyperlink` — FORCE_COLOR=3, FORCE_HYPERLINK=1. Present only where it
 *                   differed from `color`: in a terminal that advertised
 *                   hyperlink support, links became OSC 8 escapes.
 *
 * **Never regenerate this file.** The implementation that produced it is gone;
 * these bytes are the only record of what consumers were given. Where the
 * first-party renderer deliberately renders something differently, the new
 * expectation and the reason live in `differences.ts` — never here.
 */
export interface MarkedTerminalGolden {
  name: string;
  source: string;
  plain: string;
  color: string;
  hyperlink?: string;
}

export const MARKED_TERMINAL_GOLDEN: readonly MarkedTerminalGolden[] = [
  {
    name: "heading-levels",
    source: "# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six",
    plain: "# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six",
    color: "\u001b[35m\u001b[4m\u001b[1m# One\u001b[22m\u001b[24m\u001b[39m\n\n\u001b[32m\u001b[1m## Two\u001b[22m\u001b[39m\n\n\u001b[32m\u001b[1m### Three\u001b[22m\u001b[39m\n\n\u001b[32m\u001b[1m#### Four\u001b[22m\u001b[39m\n\n\u001b[32m\u001b[1m##### Five\u001b[22m\u001b[39m\n\n\u001b[32m\u001b[1m###### Six\u001b[22m\u001b[39m",
  },
  {
    name: "heading-inline",
    source: "# Title with **bold**, *em* and `code`\n\n## Sub with [a link](https://example.com)",
    plain: "# Title with bold, em and code\n\n## Sub with a link (https://example.com)",
    color: "\u001b[35m\u001b[4m\u001b[1m# Title with \u001b[1mbold\u001b[22m\u001b[1m, \u001b[3mem\u001b[23m and \u001b[33mcode\u001b[39m\u001b[35m\u001b[22m\u001b[24m\u001b[39m\n\n\u001b[32m\u001b[1m## Sub with \u001b[34ma link (\u001b[34m\u001b[4mhttps://example.com\u001b[24m\u001b[39m\u001b[32m\u001b[34m)\u001b[39m\u001b[32m\u001b[22m\u001b[39m",
    hyperlink: "\u001b[35m\u001b[4m\u001b[1m# Title with \u001b[1mbold\u001b[22m\u001b[1m, \u001b[3mem\u001b[23m and \u001b[33mcode\u001b[39m\u001b[35m\u001b[22m\u001b[24m\u001b[39m\n\n\u001b[32m\u001b[1m## Sub with \u001b[34m\u001b]8;;https://example.com\u0007\u001b[34m\u001b[4ma link\u001b[24m\u001b[39m\u001b[32m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[32m\u001b[22m\u001b[39m",
  },
  {
    name: "heading-setext",
    source: "Setext one\n==========\n\nSetext two\n----------",
    plain: "# Setext one\n\n## Setext two",
    color: "\u001b[35m\u001b[4m\u001b[1m# Setext one\u001b[22m\u001b[24m\u001b[39m\n\n\u001b[32m\u001b[1m## Setext two\u001b[22m\u001b[39m",
  },
  {
    name: "heading-long",
    source: "## The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.",
    plain: "## The quick brown fox jumps over the lazy dog while the build pipeline keeps\nrunning every single test in the suite again.",
    color: "\u001b[32m\u001b[1m## The quick brown fox jumps over the lazy dog while the build pipeline keeps\u001b[22m\u001b[39m\n\u001b[32m\u001b[1mrunning every single test in the suite again.\u001b[22m\u001b[39m",
  },
  {
    name: "emphasis",
    source: "*italic* _also italic_ **bold** __also bold__ ***both*** ~~struck~~",
    plain: "italic also italic bold also bold both struck",
    color: "\u001b[0m\u001b[3mitalic\u001b[23m \u001b[3malso italic\u001b[23m \u001b[1mbold\u001b[22m \u001b[1malso bold\u001b[22m \u001b[3m\u001b[1mboth\u001b[22m\u001b[23m \u001b[2m\u001b[90m\u001b[9mstruck\u001b[29m\u001b[39m\u001b[22m\u001b[0m",
  },
  {
    name: "emphasis-nested",
    source: "**bold with *italic* inside** and *italic with **bold** inside*",
    plain: "bold with italic inside and italic with bold inside",
    color: "\u001b[0m\u001b[1mbold with \u001b[3mitalic\u001b[23m inside\u001b[22m and \u001b[3mitalic with \u001b[1mbold\u001b[22m inside\u001b[23m\u001b[0m",
  },
  {
    name: "inline-code",
    source: "Run `npm test`, then `a:b:c` and `x & y < z`.",
    plain: "Run npm test, then a:b:c and x & y < z.",
    color: "\u001b[0mRun \u001b[33mnpm test\u001b[39m, then \u001b[33ma:b:c\u001b[39m and \u001b[33mx & y < z\u001b[39m.\u001b[0m",
  },
  {
    name: "inline-code-backticks",
    source: "Double: `` a ` b `` done.",
    plain: "Double: a ` b done.",
    color: "\u001b[0mDouble: \u001b[33ma ` b\u001b[39m done.\u001b[0m",
  },
  {
    name: "escapes",
    source: "\\*not emphasis\\* and \\`not code\\` and 1\\. not a list",
    plain: "*not emphasis* and `not code` and 1. not a list",
    color: "\u001b[0m*not emphasis* and `not code` and 1. not a list\u001b[0m",
  },
  {
    name: "entities",
    source: "a & b < c > d \"e\" 'f' &amp; &copy; &#39;",
    plain: "a & b < c > d \"e\" 'f' & &copy; '",
    color: "\u001b[0ma & b < c > d \"e\" 'f' & &copy; '\u001b[0m",
  },
  {
    name: "hard-breaks",
    source: "line one  \nline two\\\nline three",
    plain: "line one\nline two\nline three",
    color: "\u001b[0mline one\nline two\nline three\u001b[0m",
  },
  {
    name: "soft-break",
    source: "line one\nline two\nline three",
    plain: "line one line two line three",
    color: "\u001b[0mline one\u001b[0m \u001b[0mline two\u001b[0m \u001b[0mline three\u001b[0m",
  },
  {
    name: "html-inline",
    source: "Some <b>bold html</b> and <kbd>Ctrl</kbd> here.",
    plain: "Some <b>bold html</b> and <kbd>Ctrl</kbd> here.",
    color: "\u001b[0mSome \u001b[90m<b>\u001b[39mbold html\u001b[90m</b>\u001b[39m and \u001b[90m<kbd>\u001b[39mCtrl\u001b[90m</kbd>\u001b[39m here.\u001b[0m",
  },
  {
    name: "html-block",
    source: "<div align=\"center\">\n  <img src=\"x.png\">\n</div>\n\nAfter.",
    plain: "<div align=\"center\">\n  <img src=\"x.png\">\n</div>\n\nAfter.",
    color: "\u001b[90m<div align=\"center\">\u001b[39m\n\u001b[90m  <img src=\"x.png\">\u001b[39m\n\u001b[90m</div>\u001b[39m\n\u001b[90m\u001b[39m\n\u001b[90m\u001b[39m\u001b[0mAfter.\u001b[0m",
  },
  {
    name: "link-inline",
    source: "See [the docs](https://ui.particle.academy/docs) for more.",
    plain: "See the docs (https://ui.particle.academy/docs) for more.",
    color: "\u001b[0mSee \u001b[34mthe docs (\u001b[34m\u001b[4mhttps://ui.particle.academy/docs\u001b[24m\u001b[39m\u001b[34m)\u001b[39m for more.\u001b[0m",
    hyperlink: "\u001b[0mSee \u001b[34m\u001b]8;;https://ui.particle.academy/docs\u0007\u001b[34m\u001b[4mthe docs\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m for more.\u001b[0m",
  },
  {
    name: "link-title",
    source: "See [the docs](https://ui.particle.academy/docs \"Docs title\").",
    plain: "See the docs (https://ui.particle.academy/docs).",
    color: "\u001b[0mSee \u001b[34mthe docs (\u001b[34m\u001b[4mhttps://ui.particle.academy/docs\u001b[24m\u001b[39m\u001b[34m)\u001b[39m.\u001b[0m",
    hyperlink: "\u001b[0mSee \u001b[34m\u001b]8;;https://ui.particle.academy/docs\u0007\u001b[34m\u001b[4mthe docs\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m.\u001b[0m",
  },
  {
    name: "link-autolink",
    source: "Visit <https://example.com/path?a=1+2> now.",
    plain: "Visit https://example.com/path?a=1+2 now.",
    color: "\u001b[0mVisit \u001b[34m\u001b[34m\u001b[4mhttps://example.com/path?a=1+2\u001b[24m\u001b[39m\u001b[34m\u001b[39m now.\u001b[0m",
    hyperlink: "\u001b[0mVisit \u001b[34m\u001b]8;;https://example.com/path?a=1%202\u0007\u001b[34m\u001b[4mhttps://example.com/path?a=1+2\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m now.\u001b[0m",
  },
  {
    name: "link-bare-url",
    source: "Visit https://example.com/bare today.",
    plain: "Visit https://example.com/bare today.",
    color: "\u001b[0mVisit \u001b[34m\u001b[34m\u001b[4mhttps://example.com/bare\u001b[24m\u001b[39m\u001b[34m\u001b[39m today.\u001b[0m",
    hyperlink: "\u001b[0mVisit \u001b[34m\u001b]8;;https://example.com/bare\u0007\u001b[34m\u001b[4mhttps://example.com/bare\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m today.\u001b[0m",
  },
  {
    name: "link-text-equals-href",
    source: "[https://example.com](https://example.com)",
    plain: "https://example.com",
    color: "\u001b[0m\u001b[34m\u001b[34m\u001b[4mhttps://example.com\u001b[24m\u001b[39m\u001b[34m\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[34m\u001b]8;;https://example.com\u0007\u001b[34m\u001b[4mhttps://example.com\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[0m",
  },
  {
    name: "link-email",
    source: "Mail <dev@example.com> please.",
    plain: "Mail dev@example.com (mailto:dev@example.com) please.",
    color: "\u001b[0mMail \u001b[34mdev@example.com (\u001b[34m\u001b[4mmailto:dev@example.com\u001b[24m\u001b[39m\u001b[34m)\u001b[39m please.\u001b[0m",
    hyperlink: "\u001b[0mMail \u001b[34m\u001b]8;;mailto:dev@example.com\u0007\u001b[34m\u001b[4mdev@example.com\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m please.\u001b[0m",
  },
  {
    name: "link-reference",
    source: "A [reference link][ref].\n\n[ref]: https://example.com/ref",
    plain: "A reference link (https://example.com/ref).",
    color: "\u001b[0mA \u001b[34mreference link (\u001b[34m\u001b[4mhttps://example.com/ref\u001b[24m\u001b[39m\u001b[34m)\u001b[39m.\u001b[0m",
    hyperlink: "\u001b[0mA \u001b[34m\u001b]8;;https://example.com/ref\u0007\u001b[34m\u001b[4mreference link\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m.\u001b[0m",
  },
  {
    name: "link-formatted-text",
    source: "[**bold** link](https://example.com)",
    plain: "bold link (https://example.com)",
    color: "\u001b[0m\u001b[34m\u001b[1mbold\u001b[22m link (\u001b[34m\u001b[4mhttps://example.com\u001b[24m\u001b[39m\u001b[34m)\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[34m\u001b]8;;https://example.com\u0007\u001b[34m\u001b[4m\u001b[1mbold\u001b[22m link\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[0m",
  },
  {
    name: "link-spoof",
    source: "[https://bank.example](https://evil.example/login)",
    plain: "https://bank.example (https://evil.example/login)",
    color: "\u001b[0m\u001b[34mhttps://bank.example (\u001b[34m\u001b[4mhttps://evil.example/login\u001b[24m\u001b[39m\u001b[34m)\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[34m\u001b]8;;https://evil.example/login\u0007\u001b[34m\u001b[4mhttps://bank.example\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[0m",
  },
  {
    name: "image",
    source: "![Alt text](https://example.com/a.png \"A title\")\n\n![no title](b.png)",
    plain: "![Alt text – A title](https://example.com/a.png) \n\n![no title](b.png)",
    color: "\u001b[0m![Alt text – A title](https://example.com/a.png)\u001b[0m \u001b[0m\u001b[0m\n\n\u001b[0m![no title](b.png)\u001b[0m \u001b[0m\u001b[0m",
  },
  {
    name: "list-unordered",
    source: "- one\n- two\n- three",
    plain: "  * one\n  * two\n  * three",
    color: "  * \u001b[0mone\u001b[0m\n  * \u001b[0mtwo\u001b[0m\n  * \u001b[0mthree\u001b[0m",
  },
  {
    name: "list-unordered-star-plus",
    source: "* star\n* star\n\n+ plus\n+ plus",
    plain: "  * star\n  * star\n\n  * plus\n  * plus",
    color: "  * \u001b[0mstar\u001b[0m\n  * \u001b[0mstar\u001b[0m\n\n  * \u001b[0mplus\u001b[0m\n  * \u001b[0mplus\u001b[0m",
  },
  {
    name: "list-ordered",
    source: "1. first\n2. second\n3. third",
    plain: "  1. first\n  2. second\n  3. third",
    color: "  1. \u001b[0mfirst\u001b[0m\n  2. \u001b[0msecond\u001b[0m\n  3. \u001b[0mthird\u001b[0m",
  },
  {
    name: "list-ordered-start",
    source: "3. three\n4. four\n5. five",
    plain: "  1. three\n  2. four\n  3. five",
    color: "  1. \u001b[0mthree\u001b[0m\n  2. \u001b[0mfour\u001b[0m\n  3. \u001b[0mfive\u001b[0m",
  },
  {
    name: "list-ordered-ten",
    source: "1. a\n2. b\n3. c\n4. d\n5. e\n6. f\n7. g\n8. h\n9. i\n10. j\n11. k",
    plain: "  1. a\n  2. b\n  3. c\n  4. d\n  5. e\n  6. f\n  7. g\n  8. h\n  9. i\n  10. j\n  11. k",
    color: "  1. \u001b[0ma\u001b[0m\n  2. \u001b[0mb\u001b[0m\n  3. \u001b[0mc\u001b[0m\n  4. \u001b[0md\u001b[0m\n  5. \u001b[0me\u001b[0m\n  6. \u001b[0mf\u001b[0m\n  7. \u001b[0mg\u001b[0m\n  8. \u001b[0mh\u001b[0m\n  9. \u001b[0mi\u001b[0m\n  10. \u001b[0mj\u001b[0m\n  11. \u001b[0mk\u001b[0m",
  },
  {
    name: "list-nested-unordered",
    source: "- parent\n  - child\n    - grandchild\n  - child two\n- parent two",
    plain: "  * parent\n    * child\n      * grandchild\n    * child two\n  * parent two",
    color: "  * \u001b[0mparent\n    * \u001b[0m\u001b[0mchild\u001b[0m\n    \u001b[0m  \n    * \u001b[0m\u001b[0m\u001b[0m\u001b[0mgrandchild\u001b[0m\u001b[0m\u001b[0m\u001b[0m\u001b[0m\u001b[0m\u001b[0m\n    \u001b[0m\n    * \u001b[0m\u001b[0mchild two\u001b[0m\u001b[0m\u001b[0m\n  * \u001b[0mparent two\u001b[0m",
  },
  {
    name: "list-nested-mixed",
    source: "1. step\n   - detail a\n   - detail b\n2. next step\n   1. sub one\n   2. sub two",
    plain: "  1. step\n    * detail a\n    2. detail b\n  3. next step\n    1. sub one\n    2. sub two",
    color: "  1. \u001b[0mstep\n    * \u001b[0m\u001b[0mdetail a\u001b[0m\u001b[0m\u001b[0m\n     \u001b[0m\n    * \u001b[0m\u001b[0mdetail b\u001b[0m\u001b[0m\u001b[0m\n  2. \u001b[0mnext step\n    1. \u001b[0m\u001b[0msub one\u001b[0m\u001b[0m\u001b[0m\n     \u001b[0m\n    2. \u001b[0m\u001b[0msub two\u001b[0m\u001b[0m\u001b[0m",
  },
  {
    name: "list-inline-formatting",
    source: "- **bold** item\n- item with `code`\n- [link](https://example.com)",
    plain: "  * **bold** item\n  * item with `code`\n  * [link](https://example.com)",
    color: "  * \u001b[0m**bold** item\u001b[0m\n  * \u001b[0mitem with `code`\u001b[0m\n  * \u001b[0m[link](https://example.com)\u001b[0m",
  },
  {
    name: "list-loose",
    source: "- first paragraph\n\n- second paragraph\n\n- third",
    plain: "  * first paragraph\n  * second paragraph\n  * third",
    color: "  * \u001b[0m\u001b[0m\u001b[0mfirst paragraph\u001b[0m\u001b[0m\u001b[0m\n  * \u001b[0m\u001b[0m\u001b[0msecond paragraph\u001b[0m\u001b[0m\u001b[0m\n  * \u001b[0m\u001b[0m\u001b[0mthird\u001b[0m\u001b[0m\u001b[0m",
  },
  {
    name: "list-loose-multi-paragraph",
    source: "1. para one\n\n   para one continued\n\n2. para two",
    plain: "  1. para one\n     para one continued\n  2. para two",
    color: "  1. \u001b[0m\u001b[0m\u001b[0mpara one\u001b[0m\u001b[0m\u001b[0m\n     \u001b[0m\u001b[0m\n     \u001b[0m\u001b[0m\u001b[0mpara one continued\u001b[0m\u001b[0m\u001b[0m\n  2. \u001b[0m\u001b[0m\u001b[0mpara two\u001b[0m\u001b[0m\u001b[0m",
  },
  {
    name: "list-task",
    source: "- [x] done task\n- [ ] open task\n- plain item",
    plain: "  * [X]  done task\n  * [ ]  open task\n  * plain item",
    color: "  * \u001b[0m[X]  done task\u001b[0m\n  * \u001b[0m[ ]  open task\u001b[0m\n  * \u001b[0mplain item\u001b[0m",
  },
  {
    name: "list-with-code",
    source: "- install:\n\n  ```bash\n  npm i\n  ```\n\n- run",
    plain: "  * install:\n      npm i\n  * run",
    color: "  * \u001b[0m\u001b[0m\u001b[0minstall:\u001b[0m\u001b[0m\u001b[0m\n    \u001b[0m\u001b[0m\n    \u001b[0m  npm i\u001b[0m\n  * \u001b[0m\u001b[0m\u001b[0mrun\u001b[0m\u001b[0m\u001b[0m",
  },
  {
    name: "list-long-item",
    source: "- The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.\n- short",
    plain: "  * The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.\n  * short",
    color: "  * \u001b[0mThe quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.\u001b[0m\n  * \u001b[0mshort\u001b[0m",
  },
  {
    name: "list-then-paragraph",
    source: "- a\n- b\n\nParagraph after the list.",
    plain: "  * a\n  * b\n\nParagraph after the list.",
    color: "  * \u001b[0ma\u001b[0m\n  * \u001b[0mb\u001b[0m\n\n\u001b[0mParagraph after the list.\u001b[0m",
  },
  {
    name: "blockquote",
    source: "> quoted text\n> continues here",
    plain: "  quoted text continues here",
    color: "\u001b[90m\u001b[3m  \u001b[0mquoted text\u001b[0m \u001b[0mcontinues here\u001b[0m\u001b[23m\u001b[39m",
  },
  {
    name: "blockquote-nested",
    source: "> outer\n>\n> > inner\n>\n> back to outer",
    plain: "  outer\n  \n    inner\n  \n  back to outer",
    color: "\u001b[90m\u001b[3m  \u001b[0mouter\u001b[0m\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[90m\u001b[3m  \u001b[0minner\u001b[0m\u001b[23m\u001b[3m\u001b[39m\u001b[90m\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[0mback to outer\u001b[0m\u001b[23m\u001b[39m",
  },
  {
    name: "blockquote-with-list",
    source: "> - one\n> - two\n>\n> **bold** in quote",
    plain: "  * one\n    * two\n  \n  bold in quote",
    color: "\u001b[90m\u001b[3m  * \u001b[0mone\u001b[0m\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m    * \u001b[0mtwo\u001b[0m\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[0m\u001b[1mbold\u001b[22m in quote\u001b[0m\u001b[23m\u001b[39m",
  },
  {
    name: "blockquote-long",
    source: "> The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.",
    plain: "  The quick brown fox jumps over the lazy dog while the build pipeline keeps\n  running every single test in the suite again.",
    color: "\u001b[90m\u001b[3m  \u001b[0mThe quick brown fox jumps over the lazy dog while the build pipeline keeps\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  running every single test in the suite again.\u001b[0m\u001b[23m\u001b[39m",
  },
  {
    name: "code-ts",
    source: "```ts\nimport { x } from \"./x.js\";\n// comment\nexport const answer: number = 42;\nfunction add(a: number, b: number) { return a + b; }\n```",
    plain: "  import { x } from \"./x.js\";\n  // comment\n  export const answer: number = 42;\n  function add(a: number, b: number) { return a + b; }",
    color: "  \u001b[34mimport\u001b[39m { x } \u001b[34mfrom\u001b[39m \u001b[31m\"./x.js\"\u001b[39m;\n  \u001b[32m// comment\u001b[39m\n  \u001b[34mexport\u001b[39m \u001b[34mconst\u001b[39m answer: \u001b[36mnumber\u001b[39m = \u001b[32m42\u001b[39m;\n  \u001b[33m\u001b[34mfunction\u001b[39m\u001b[33m add(a: \u001b[36mnumber\u001b[39m\u001b[33m, b: \u001b[36mnumber\u001b[39m\u001b[33m) \u001b[39m{ \u001b[34mreturn\u001b[39m a + b; }",
  },
  {
    name: "code-tsx",
    source: "```tsx\nexport function App() {\n  return <Box id=\"a\">hi</Box>;\n}\n```",
    plain: "  export function App() {\n    return <Box id=\"a\">hi</Box>;\n  }",
    color: "  \u001b[34mexport\u001b[39m \u001b[33m\u001b[34mfunction\u001b[39m\u001b[33m App() \u001b[39m{\n    \u001b[34mreturn\u001b[39m \u001b[90m<\u001b[34mBox\u001b[39m\u001b[90m \u001b[36mid\u001b[39m\u001b[90m=\u001b[31m\"a\"\u001b[39m\u001b[90m>\u001b[39mhi\u001b[90m</\u001b[34mBox\u001b[39m\u001b[90m>\u001b[39m;\n  }",
  },
  {
    name: "code-js",
    source: "```js\nconst s = 'single' + \"double\" + `tpl ${1}`;\nif (s === null) { throw new Error(\"x\"); }\n/* block */ let n = 0x1f;\n```",
    plain: "  const s = 'single' + \"double\" + `tpl ${1}`;\n  if (s === null) { throw new Error(\"x\"); }\n  /* block */ let n = 0x1f;",
    color: "  \u001b[34mconst\u001b[39m s = \u001b[31m'single'\u001b[39m + \u001b[31m\"double\"\u001b[39m + \u001b[31m`tpl ${\u001b[32m1\u001b[39m\u001b[31m}`\u001b[39m;\n  \u001b[34mif\u001b[39m (s === \u001b[34mnull\u001b[39m) { \u001b[34mthrow\u001b[39m \u001b[34mnew\u001b[39m \u001b[36mError\u001b[39m(\u001b[31m\"x\"\u001b[39m); }\n  \u001b[32m/* block */\u001b[39m \u001b[34mlet\u001b[39m n = \u001b[32m0x1f\u001b[39m;",
  },
  {
    name: "code-json",
    source: "```json\n{ \"name\": \"fancy\", \"version\": 1, \"ok\": true, \"none\": null }\n```",
    plain: "  { \"name\": \"fancy\", \"version\": 1, \"ok\": true, \"none\": null }",
    color: "  { \u001b[36m\"name\"\u001b[39m: \u001b[31m\"fancy\"\u001b[39m, \u001b[36m\"version\"\u001b[39m: \u001b[32m1\u001b[39m, \u001b[36m\"ok\"\u001b[39m: \u001b[34mtrue\u001b[39m, \u001b[36m\"none\"\u001b[39m: \u001b[34mnull\u001b[39m }",
  },
  {
    name: "code-bash",
    source: "```bash\n# install\nnpm install --save \"@particle-academy/fancy-tui\" && echo $HOME\n```",
    plain: "  # install\n  npm install --save \"@particle-academy/fancy-tui\" && echo $HOME",
    color: "  \u001b[32m# install\u001b[39m\n  npm install --save \u001b[31m\"@particle-academy/fancy-tui\"\u001b[39m && \u001b[36mecho\u001b[39m $HOME",
  },
  {
    name: "code-python",
    source: "```python\ndef greet(name: str) -> str:\n    # say hi\n    return f\"hi {name}\" if name else None\n```",
    plain: "  def greet(name: str) -> str:\n      # say hi\n      return f\"hi {name}\" if name else None",
    color: "  \u001b[33m\u001b[34mdef\u001b[39m\u001b[33m greet(name: \u001b[36mstr\u001b[39m\u001b[33m) -> \u001b[36mstr\u001b[39m\u001b[33m:\u001b[39m\n      \u001b[32m# say hi\u001b[39m\n      \u001b[34mreturn\u001b[39m \u001b[31mf\"hi {name}\"\u001b[39m \u001b[34mif\u001b[39m name \u001b[34melse\u001b[39m \u001b[34mNone\u001b[39m",
  },
  {
    name: "code-php",
    source: "```php\n<?php\nfunction add(int $a, int $b): int { return $a + $b; } // sum\n$x = new Foo('bar');\n```",
    plain: "  <?php\n  function add(int $a, int $b): int { return $a + $b; } // sum\n  $x = new Foo('bar');",
    color: "  \u001b[90m<?php\u001b[39m\n  \u001b[33m\u001b[34mfunction\u001b[39m\u001b[33m add(\u001b[34mint\u001b[39m\u001b[33m $a, \u001b[34mint\u001b[39m\u001b[33m $b): int \u001b[39m{ \u001b[34mreturn\u001b[39m $a + $b; } \u001b[32m// sum\u001b[39m\n  $x = \u001b[34mnew\u001b[39m Foo(\u001b[31m'bar'\u001b[39m);",
  },
  {
    name: "code-diff",
    source: "```diff\n--- a/file\n+++ b/file\n@@ -1,2 +1,2 @@\n-old line\n+new line\n unchanged\n```",
    plain: "  --- a/file\n  +++ b/file\n  @@ -1,2 +1,2 @@\n  -old line\n  +new line\n   unchanged",
    color: "  \u001b[32m--- a/file\u001b[39m\n  \u001b[32m+++ b/file\u001b[39m\n  \u001b[90m@@ -1,2 +1,2 @@\u001b[39m\n  \u001b[31m-old line\u001b[39m\n  \u001b[32m+new line\u001b[39m\n   unchanged",
  },
  {
    name: "code-yaml",
    source: "```yaml\nname: ci\non: [push]\nenv:\n  COUNT: 3 # comment\n  FLAG: true\n```",
    plain: "  name: ci\n  on: [push]\n  env:\n    COUNT: 3 # comment\n    FLAG: true",
    color: "  \u001b[36mname:\u001b[39m \u001b[31mci\u001b[39m\n  \u001b[36mon:\u001b[39m [\u001b[31mpush\u001b[39m]\n  \u001b[36menv:\u001b[39m\n    \u001b[36mCOUNT:\u001b[39m \u001b[32m3\u001b[39m \u001b[32m# comment\u001b[39m\n    \u001b[36mFLAG:\u001b[39m \u001b[34mtrue\u001b[39m",
  },
  {
    name: "code-sql",
    source: "```sql\nSELECT id, name FROM users WHERE id = 1;\n```",
    plain: "  SELECT id, name FROM users WHERE id = 1;",
    color: "  \u001b[34mSELECT\u001b[39m id, name \u001b[34mFROM\u001b[39m users \u001b[34mWHERE\u001b[39m id = \u001b[32m1\u001b[39m;",
  },
  {
    name: "code-rust",
    source: "```rust\nfn main() { let x: i32 = 5; println!(\"{}\", x); }\n```",
    plain: "  fn main() { let x: i32 = 5; println!(\"{}\", x); }",
    color: "  \u001b[33m\u001b[34mfn\u001b[39m\u001b[33m main\u001b[39m() { \u001b[34mlet\u001b[39m x: \u001b[36mi32\u001b[39m = \u001b[32m5\u001b[39m; \u001b[36mprintln!\u001b[39m(\u001b[31m\"{}\"\u001b[39m, x); }",
  },
  {
    name: "code-no-lang",
    source: "```\nplain fenced block\nwith two lines\n```",
    plain: "  plain fenced block\n  with two lines",
    color: "  plain fenced block\n  \u001b[34mwith\u001b[39m \u001b[34mtwo\u001b[39m \u001b[34mlines\u001b[39m",
  },
  {
    name: "code-text",
    source: "```text\nconst x = 1;\n```",
    plain: "  const x = 1;",
    color: "  const x = 1;",
  },
  {
    name: "code-unknown-lang",
    source: "```notalanguage\nconst x = 1;\n```",
    plain: "  const x = 1;",
    color: "  \u001b[33mconst x = 1;\u001b[39m",
  },
  {
    name: "code-indented",
    source: "Para.\n\n    indented code\n    second line",
    plain: "Para.\n\n  indented code\n  second line",
    color: "\u001b[0mPara.\u001b[0m\n\n  indented \u001b[36mcode\u001b[39m\n  \u001b[36msecond\u001b[39m line",
  },
  {
    name: "code-tabs",
    source: "```\n\tindented with tab\n```",
    plain: "  \tindented with tab",
    color: "  \tindented \u001b[34mwith\u001b[39m \u001b[34mtab\u001b[39m",
  },
  {
    name: "code-long-line",
    source: "```\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n```",
    plain: "  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    color: "  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    name: "code-view-showcase",
    source: "```ts\n  1 │ const x = 1;\n  2 │ export default x;\n```",
    plain: "    1 │ const x = 1;\n    2 │ export default x;",
    color: "    \u001b[32m1\u001b[39m │ \u001b[34mconst\u001b[39m x = \u001b[32m1\u001b[39m;\n    \u001b[32m2\u001b[39m │ \u001b[34mexport\u001b[39m \u001b[34mdefault\u001b[39m x;",
  },
  {
    name: "table-basic",
    source: "| Name | Status |\n| --- | --- |\n| build | passed |\n| lint | failed |",
    plain: "┌───────┬────────┐\n│ Name  │ Status │\n├───────┼────────┤\n│ build │ passed │\n├───────┼────────┤\n│ lint  │ failed │\n└───────┴────────┘",
    color: "\u001b[0m\u001b[90m┌───────\u001b[39m\u001b[90m┬────────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m Name  \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Status \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───────\u001b[39m\u001b[90m┼────────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m build \u001b[90m│\u001b[39m passed \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───────\u001b[39m\u001b[90m┼────────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m lint  \u001b[90m│\u001b[39m failed \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└───────\u001b[39m\u001b[90m┴────────┘\u001b[39m\u001b[0m",
  },
  {
    name: "table-align",
    source: "| Left | Center | Right |\n| :--- | :---: | ---: |\n| a | b | c |\n| longer cell | mid | 1 |",
    plain: "┌─────────────┬────────┬───────┐\n│ Left        │ Center │ Right │\n├─────────────┼────────┼───────┤\n│ a           │ b      │ c     │\n├─────────────┼────────┼───────┤\n│ longer cell │ mid    │ 1     │\n└─────────────┴────────┴───────┘",
    color: "\u001b[0m\u001b[90m┌─────────────\u001b[39m\u001b[90m┬────────\u001b[39m\u001b[90m┬───────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m Left        \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Center \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Right \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├─────────────\u001b[39m\u001b[90m┼────────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m a           \u001b[90m│\u001b[39m b      \u001b[90m│\u001b[39m c     \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├─────────────\u001b[39m\u001b[90m┼────────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m longer cell \u001b[90m│\u001b[39m mid    \u001b[90m│\u001b[39m 1     \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└─────────────\u001b[39m\u001b[90m┴────────\u001b[39m\u001b[90m┴───────┘\u001b[39m\u001b[0m",
  },
  {
    name: "table-inline",
    source: "| Col | Value |\n| --- | --- |\n| **bold** | `code` |\n| [link](https://x.dev) | *em* |",
    plain: "┌──────────────────────┬───────┐\n│ Col                  │ Value │\n├──────────────────────┼───────┤\n│ bold                 │ code  │\n├──────────────────────┼───────┤\n│ link (https://x.dev) │ em    │\n└──────────────────────┴───────┘",
    color: "\u001b[0m\u001b[90m┌──────────────────────\u001b[39m\u001b[90m┬───────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m Col                  \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Value \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├──────────────────────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m \u001b[1mbold\u001b[22m                 \u001b[90m│\u001b[39m \u001b[33mcode\u001b[39m  \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├──────────────────────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m \u001b[34mlink (\u001b[34m\u001b[4mhttps://x.dev\u001b[24m\u001b[39m\u001b[34m)\u001b[39m \u001b[90m│\u001b[39m \u001b[3mem\u001b[23m    \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└──────────────────────\u001b[39m\u001b[90m┴───────┘\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[90m┌──────\u001b[39m\u001b[90m┬───────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m Col  \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Value \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├──────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m \u001b[1mbold\u001b[22m \u001b[90m│\u001b[39m \u001b[33mcode\u001b[39m  \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├──────\u001b[39m\u001b[90m┼───────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m \u001b[34m\u001b]8;;https://x.dev\u0007\u001b[34m\u001b[4mlink\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m \u001b[90m│\u001b[39m \u001b[3mem\u001b[23m    \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└──────\u001b[39m\u001b[90m┴───────┘\u001b[39m\u001b[0m",
  },
  {
    name: "table-cjk",
    source: "| 名前 | 状態 |\n| --- | --- |\n| ビルド | 成功 |",
    plain: "┌────────┬──────┐\n│ 名前   │ 状態 │\n├────────┼──────┤\n│ ビルド │ 成功 │\n└────────┴──────┘",
    color: "\u001b[0m\u001b[90m┌────────\u001b[39m\u001b[90m┬──────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m 名前   \u001b[39m\u001b[90m│\u001b[39m\u001b[31m 状態 \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├────────\u001b[39m\u001b[90m┼──────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m ビルド \u001b[90m│\u001b[39m 成功 \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└────────\u001b[39m\u001b[90m┴──────┘\u001b[39m\u001b[0m",
  },
  {
    name: "table-empty-cell",
    source: "| a | b |\n| --- | --- |\n|  | 2 |",
    plain: "┌───┬───┐\n│ a │ b │\n├───┼───┤\n│   │ 2 │\n└───┴───┘",
    color: "\u001b[0m\u001b[90m┌───\u001b[39m\u001b[90m┬───┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m a \u001b[39m\u001b[90m│\u001b[39m\u001b[31m b \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───\u001b[39m\u001b[90m┼───┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m   \u001b[90m│\u001b[39m 2 \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└───\u001b[39m\u001b[90m┴───┘\u001b[39m\u001b[0m",
  },
  {
    name: "hr",
    source: "above\n\n---\n\nbelow\n\n***\n\n___",
    plain: "above\n\n-------------------------------------------------------------------------------\n\nbelow\n\n-------------------------------------------------------------------------------\n\n-------------------------------------------------------------------------------",
    color: "\u001b[0mabove\u001b[0m\n\n\u001b[0m-------------------------------------------------------------------------------\u001b[0m\n\n\u001b[0mbelow\u001b[0m\n\n\u001b[0m-------------------------------------------------------------------------------\u001b[0m\n\n\u001b[0m-------------------------------------------------------------------------------\u001b[0m",
  },
  {
    name: "paragraph-long",
    source: "The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again. The quick brown fox jumps over the lazy dog while the build pipeline keeps running every single test in the suite again.",
    plain: "The quick brown fox jumps over the lazy dog while the build pipeline keeps\nrunning every single test in the suite again. The quick brown fox jumps over the\nlazy dog while the build pipeline keeps running every single test in the suite\nagain.",
    color: "\u001b[0mThe quick brown fox jumps over the lazy dog while the build pipeline keeps\nrunning every single test in the suite again. The quick brown fox jumps over the\nlazy dog while the build pipeline keeps running every single test in the suite\nagain.\u001b[0m",
  },
  {
    name: "paragraph-long-word",
    source: "Short then aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa after.",
    plain: "Short then aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa after.",
    color: "\u001b[0mShort then aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa after.\u001b[0m",
  },
  {
    name: "paragraph-long-url",
    source: "https://example.com/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/",
    plain: "https://example.com/segment/segment/segment/segment/segment/segment/segment/segm\nent/segment/segment/segment/segment/",
    color: "\u001b[0m\u001b[34m\u001b[34m\u001b[4mhttps://example.com/segment/segment/segment/segment/segment/segment/segment/segm\nent/segment/segment/segment/segment/\u001b[24m\u001b[39m\u001b[34m\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[34m\u001b]8;;https://example.com/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/segment/\u0007\u001b[34m\u001b[4mhttps://example.com/segment/segment/segment/segment/segment/segment/segment/segm\nent/segment/segment/segment/segment/\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[0m",
  },
  {
    name: "paragraph-formatted-wrap",
    source: "This **bold phrase keeps going across the wrap boundary** and then `inline code that is long` continues *with emphasis near the end of the line* ok.",
    plain: "This bold phrase keeps going across the wrap boundary and then inline code that\nis long continues with emphasis near the end of the line ok.",
    color: "\u001b[0mThis \u001b[1mbold phrase keeps going across the wrap boundary\u001b[22m and then \u001b[33minline code that\nis long\u001b[39m continues \u001b[3mwith emphasis near the end of the line\u001b[23m ok.\u001b[0m",
  },
  {
    name: "paragraphs-multiple",
    source: "First paragraph.\n\nSecond paragraph.\n\n\n\nThird after blank lines.",
    plain: "First paragraph.\n\nSecond paragraph.\n\nThird after blank lines.",
    color: "\u001b[0mFirst paragraph.\u001b[0m\n\n\u001b[0mSecond paragraph.\u001b[0m\n\n\u001b[0mThird after blank lines.\u001b[0m",
  },
  {
    name: "unicode-cjk-short",
    source: "日本語のテキスト。",
    plain: "日本語のテキスト。",
    color: "\u001b[0m日本語のテキスト。\u001b[0m",
  },
  {
    name: "unicode-cjk-long",
    source: "これは非常に長い日本語の文章で、端末の幅を超えて折り返されるかどうかを確認するためのものです。さらに文章を続けて八十列を確実に超えるようにします。",
    plain: "これは非常に長い日本語の文章で、端末の幅を超えて折り返されるかどうかを確認するためのものです。さらに文章を続けて八十列を確実に超えるようにします。",
    color: "\u001b[0mこれは非常に長い日本語の文章で、端末の幅を超えて折り返されるかどうかを確認するためのものです。さらに文章を続けて八十列を確実に超えるようにします。\u001b[0m",
  },
  {
    name: "unicode-cjk-mixed-wrap",
    source: "Mixed 中文 text with English words and 汉字 repeated 汉字汉字汉字汉字 across the boundary of eighty columns 汉字汉字汉字.",
    plain: "Mixed 中文 text with English words and 汉字 repeated 汉字汉字汉字汉字 across the boundary of\neighty columns 汉字汉字汉字.",
    color: "\u001b[0mMixed 中文 text with English words and 汉字 repeated 汉字汉字汉字汉字 across the boundary of\neighty columns 汉字汉字汉字.\u001b[0m",
  },
  {
    name: "unicode-emoji",
    source: "Rocket 🚀 and family 👨‍👩‍👧 and flag 🇯🇵 and check ✅ done.",
    plain: "Rocket 🚀 and family 👨‍👩‍👧 and flag 🇯🇵 and check ✅ done.",
    color: "\u001b[0mRocket 🚀 and family 👨‍👩‍👧 and flag 🇯🇵 and check ✅ done.\u001b[0m",
  },
  {
    name: "unicode-emoji-long",
    source: "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀",
    plain: "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀",
    color: "\u001b[0m🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\u001b[0m",
  },
  {
    name: "unicode-combining",
    source: "Café and ñ and Z͑͒ combine.",
    plain: "Café and ñ and Z͑͒ combine.",
    color: "\u001b[0mCafé and ñ and Z͑͒ combine.\u001b[0m",
  },
  {
    name: "unicode-emoji-shortcode",
    source: "Ship it :rocket: then :white_check_mark: and :not_an_emoji: and 10:30:45.",
    plain: "Ship it 🚀 then ✅ and :not_an_emoji: and 10:30:45.",
    color: "\u001b[0mShip it 🚀 then ✅ and :not_an_emoji: and 10:30:45.\u001b[0m",
  },
  {
    name: "showcase-markdown",
    source: "## Result\n\nThe build **passed** with `0` warnings.",
    plain: "## Result\n\nThe build passed with 0 warnings.",
    color: "\u001b[32m\u001b[1m## Result\u001b[22m\u001b[39m\n\n\u001b[0mThe build \u001b[1mpassed\u001b[22m with \u001b[33m0\u001b[39m warnings.\u001b[0m",
  },
  {
    name: "agent-reply",
    source: "## Summary\n\nThe build failed because `tsconfig.json` is missing **baseUrl**.\n\n1. Add it:\n\n```json\n{ \"compilerOptions\": { \"baseUrl\": \".\" } }\n```\n\n2. Re-run `npm test`.\n\n> Note: this only affects path aliases.\n\n| Check | Result |\n| --- | --- |\n| tsc | ❌ |\n| lint | ✅ |",
    plain: "## Summary\n\nThe build failed because tsconfig.json is missing baseUrl.\n\n  1. Add it:\n\n  { \"compilerOptions\": { \"baseUrl\": \".\" } }\n\n  1. Re-run `npm test`.\n\n  Note: this only affects path aliases.\n\n┌───────┬────────┐\n│ Check │ Result │\n├───────┼────────┤\n│ tsc   │ ❌     │\n├───────┼────────┤\n│ lint  │ ✅     │\n└───────┴────────┘",
    color: "\u001b[32m\u001b[1m## Summary\u001b[22m\u001b[39m\n\n\u001b[0mThe build failed because \u001b[33mtsconfig.json\u001b[39m is missing \u001b[1mbaseUrl\u001b[22m.\u001b[0m\n\n  1. \u001b[0mAdd it:\u001b[0m\n\n  { \u001b[36m\"compilerOptions\"\u001b[39m: { \u001b[36m\"baseUrl\"\u001b[39m: \u001b[31m\".\"\u001b[39m } }\n\n  1. \u001b[0mRe-run `npm test`.\u001b[0m\n\n\u001b[90m\u001b[3m  \u001b[0mNote: this only affects path aliases.\u001b[0m\u001b[23m\u001b[39m\n\n\u001b[0m\u001b[90m┌───────\u001b[39m\u001b[90m┬────────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m Check \u001b[39m\u001b[90m│\u001b[39m\u001b[31m Result \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───────\u001b[39m\u001b[90m┼────────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m tsc   \u001b[90m│\u001b[39m ❌     \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───────\u001b[39m\u001b[90m┼────────┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m lint  \u001b[90m│\u001b[39m ✅     \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└───────\u001b[39m\u001b[90m┴────────┘\u001b[39m\u001b[0m",
  },
  {
    name: "empty",
    source: "",
    plain: "",
    color: "",
  },
  {
    name: "whitespace-only",
    source: "   \n\n  ",
    plain: "",
    color: "",
  },
  {
    name: "table-header-only",
    source: "| only | header |\n| --- | --- |",
    plain: "┌──────┬────────┐\n│ only │ header │\n└──────┴────────┘",
    color: "\u001b[0m\u001b[90m┌──────\u001b[39m\u001b[90m┬────────┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m only \u001b[39m\u001b[90m│\u001b[39m\u001b[31m header \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└──────\u001b[39m\u001b[90m┴────────┘\u001b[39m\u001b[0m",
  },
  {
    name: "table-escaped-pipe",
    source: "| a \\| b | c |\n| --- | --- |\n| 1 \\| 2 | 3 |",
    plain: "┌───────┬───┐\n│ a | b │ c │\n├───────┼───┤\n│ 1 | 2 │ 3 │\n└───────┴───┘",
    color: "\u001b[0m\u001b[90m┌───────\u001b[39m\u001b[90m┬───┐\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m\u001b[31m a | b \u001b[39m\u001b[90m│\u001b[39m\u001b[31m c \u001b[39m\u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m├───────\u001b[39m\u001b[90m┼───┤\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m│\u001b[39m 1 | 2 \u001b[90m│\u001b[39m 3 \u001b[90m│\u001b[39m\u001b[0m\n\u001b[0m\u001b[90m└───────\u001b[39m\u001b[90m┴───┘\u001b[39m\u001b[0m",
  },
  {
    name: "entities-in-code",
    source: "`&amp;` and [a &amp; b](https://x.dev/?a=1&amp;b=2)",
    plain: "& and a & b (https://x.dev/?a=1&b=2)",
    color: "\u001b[0m\u001b[33m&\u001b[39m and \u001b[34ma & b (\u001b[34m\u001b[4mhttps://x.dev/?a=1&b=2\u001b[24m\u001b[39m\u001b[34m)\u001b[39m\u001b[0m",
    hyperlink: "\u001b[0m\u001b[33m&\u001b[39m and \u001b[34m\u001b]8;;https://x.dev/?a=1&b=2\u0007\u001b[34m\u001b[4ma & b\u001b[24m\u001b[39m\u001b[34m\u001b]8;;\u0007\u001b[39m\u001b[0m",
  },
  {
    name: "blockquote-with-code",
    source: "> ```js\n> const a = 1;\n> ```\n>\n> after",
    plain: "  const a = 1;\n  \n  after",
    color: "\u001b[90m\u001b[3m  \u001b[34mconst\u001b[39m\u001b[90m a = \u001b[32m1\u001b[39m\u001b[90m;\u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[23m\u001b[39m\n\u001b[90m\u001b[3m  \u001b[0mafter\u001b[0m\u001b[23m\u001b[39m",
  },
  {
    name: "strikethrough-with-bold",
    source: "~~struck **bold** text~~ after",
    plain: "struck bold text after",
    color: "\u001b[0m\u001b[2m\u001b[90m\u001b[9mstruck \u001b[1mbold\u001b[22m\u001b[2m text\u001b[29m\u001b[39m\u001b[22m after\u001b[0m",
  },
  {
    name: "list-ordered-paren",
    source: "1) one\n2) two",
    plain: "  1. one\n  2. two",
    color: "  1. \u001b[0mone\u001b[0m\n  2. \u001b[0mtwo\u001b[0m",
  },
  {
    name: "code-empty",
    source: "```\n```",
    plain: "",
    color: "",
  },
  {
    name: "code-blank-lines",
    source: "```\na\n\nb\n```",
    plain: "  a\n  \n  b",
    color: "  a\n  \n  b",
  },
  {
    name: "html-comment",
    source: "<!-- hidden -->\n\ntext",
    plain: "<!-- hidden -->\n\ntext",
    color: "\u001b[90m<!-- hidden -->\u001b[39m\n\u001b[90m\u001b[39m\n\u001b[90m\u001b[39m\u001b[0mtext\u001b[0m",
  },
  {
    name: "heading-then-list",
    source: "### Steps\n- one\n- two",
    plain: "### Steps\n\n  * one\n  * two",
    color: "\u001b[32m\u001b[1m### Steps\u001b[22m\u001b[39m\n\n  * \u001b[0mone\u001b[0m\n  * \u001b[0mtwo\u001b[0m",
  },
  {
    name: "list-item-wrapped-nested",
    source: "- parent item\n  continued lazily\n  - child",
    plain: "  * parent item\n    continued lazily\n    * child",
    color: "  * \u001b[0mparent item\u001b[0m\n    \u001b[0mcontinued lazily\n    * \u001b[0m\u001b[0mchild\u001b[0m\u001b[0m\u001b[0m",
  },
  {
    name: "image-in-paragraph",
    source: "Before ![icon](i.png) after.",
    plain: "Before ![icon](i.png) after.",
    color: "\u001b[0mBefore ![icon](i.png)\u001b[0m \u001b[0m after.\u001b[0m",
  },
];
