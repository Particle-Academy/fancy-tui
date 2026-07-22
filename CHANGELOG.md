# Changelog

All notable changes to `@particle-academy/fancy-tui` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0:** breaking changes land in MINOR releases. Read the entry, not the
> version number.

## [Unreleased]

## [0.8.0] — 2026-07-22

### Added

- **`ShowcaseExample.interactive`** — a boolean on every entry in
  `SHOWCASE_EXAMPLES`, `true` when the example responds to keyboard input on its
  own. A host that renders one example persistently uses it to decide which
  previews are worth focusing and forwarding keystrokes to; it is unset on the
  purely visual examples and the two `scrollback` lists.

### Changed

- **The interactive showcase examples are now self-contained stateful demos**
  rather than frozen snapshots. Previously an interactive `node` was pinned to a
  constant `value` with a no-op handler
  (`<Select value="test" onChange={noop} />`), so a host that rendered it live
  and fed it keys saw nothing change. Each is now a small component that owns its
  state with `useState` and passes a REAL `onChange` / `onPress` / `onClose`, so
  the accordion opens, the input types, the select moves, the slider slides, the
  modal and drawer close on escape. 22 examples in all: Accordion, Autocomplete,
  Button, Checkbox, CheckboxGroup, Command, Composer, Drawer, Field, Form, Input,
  Menu, Modal, MultilineInput, MultiSwitch, Pagination, Pillbox, RadioGroup,
  Select, Slider, Switch, Tabs.

  Each interactive control auto-focuses (the `autoFocus` default on
  `InteractiveProps`), so an example rendered alone is ready for input
  immediately, with no focus competition.

  **No action needed for the web gallery.** A stateful example renders its
  INITIAL state, which equals the frame captured before, so
  `showcase/previews.json` is byte-for-byte unchanged — same contents, key order,
  and all 62 entries. The `source` snippet beside each example was already
  written in the idiomatic controlled `value`+`onChange` form a real user writes,
  and is unchanged; the stateful wrapper is demo scaffolding, not shown.

### Notes

- The controlled-but-keyboard-inert display components — `Table`, `TreeNav`,
  `FileBrowser`, `Sidebar` — are deliberately NOT flagged interactive. They take
  controlled props for agent and programmatic use but call neither `useInput` nor
  `useFocus`, so a keystroke does not move them; they respond to agent commands
  through the surface registry instead. Their examples stay frozen.

## [0.7.0] — 2026-07-21

### Added

- **`@particle-academy/fancy-tui/showcase`** — the showcase example table, now
  an importable module instead of a build-script detail. Every documented
  component ships with a LIVE example node:

  ```tsx
  import { SHOWCASE_EXAMPLES, findShowcaseExample } from "@particle-academy/fancy-tui/showcase";

  const badge = findShowcaseExample("badge");
  // render it inline in your own Ink tree — it is a real component, not a picture
  <Box width={40} overflow="hidden">{badge?.node}</Box>
  ```

  Exports `SHOWCASE_EXAMPLES` (`{ slug, name, group, source, node, columns? }`),
  `SHOWCASE_EXAMPLES_BY_SLUG`, `findShowcaseExample(slug)`, `SHOWCASE_COLUMNS`,
  and the `ShowcaseExample` type.

  This is what a docs host in Node needs: a captured ANSI frame is a photograph
  of a component at one fixed width, so a terminal UI embedding it can only
  reproduce someone else's layout. With the nodes exported, the host renders the
  component itself — Yoga lays it out at the reader's real terminal size.

  Live nodes are not free-floating: they size themselves from the nearest
  `FancyTuiProvider` and can be taller or wider than the space a host has.
  Wrap them in a fixed-size `<Box overflow="hidden">` (and, if the pane is
  narrower than the terminal, a nested `<FancyTuiProvider width={…}>`) so a tall
  example clips instead of pushing the host's own chrome off screen.

### Changed

- `showcase/previews.json` is now a DERIVED artifact rather than the source of
  truth. `scripts/showcase.tsx` imports the same table and captures it exactly
  as before, so non-Node consumers (the web gallery) are unaffected — the file's
  contents, key order, and all 62 entries are byte-identical. **No action
  needed:** `@particle-academy/fancy-tui/showcase/previews.json` still resolves
  and still has the same shape.

## [0.6.0] — 2026-07-21

### Added

- **`Drawer`** — an edge-anchored panel that paints over the layout, mirroring
  `react-fancy`'s `Drawer` so the two kits teach one API.

  ```tsx
  <Drawer id="filters" open={open} onClose={close} side="right" size="md" title="Filters">
    <Drawer.Body><Text>state: failing</Text></Drawer.Body>
    <Drawer.Footer><Text tone="muted">enter apply</Text></Drawer.Footer>
  </Drawer>
  ```

  `size` addresses the drawer's OWN axis — width on `left`/`right`, height on
  `top`/`bottom` — and the cross axis fills. One scale, two meanings, so
  `size="lg"` does not have to be re-learned when a drawer moves from the side
  to the bottom.

  **Attach it to something smaller than the screen** — a Card, a layout pane,
  the box around a `Composer` — by rendering it there and passing that region's
  `bounds`. An absolutely positioned Ink box already resolves against its
  parent; the dimensions have to be explicit because the opaque fill is a
  literal count of space characters. Measure INSIDE the border (a 40-column
  bordered Card gives its absolute children 38 columns): bounds too small leave
  a strip the layout bleeds through, bounds too large paint outside the region.

- **`Card` variants** — `outlined` (default, unchanged look), `elevated` (bold
  border; the terminal's only honest analogue of a shadow) and `flat` (no
  border at all, for a card inside an already-bordered container).

- **`Screen fullHeight`** — claims every row of the terminal. Needed by
  overlays, see below.

- **Overlay building blocks**, for anyone composing their own: `OverlaySurface`,
  `OverlayHeader` / `OverlayBody` / `OverlayFooter`, `useOverlay`, the pure
  geometry helpers `modalRect` / `drawerRect` / `overlayFits`, and
  `OVERLAY_MIN_WIDTH` / `OVERLAY_MIN_HEIGHT`. Plus `tuiBoldNode`, the bold
  sibling of `tuiNode`.

- **`Modal` and `Drawer` register agent surfaces** (`kind: "modal"` /
  `"drawer"`), each exposing what an agent needs to see and a `close` command.
  `Modal` had imported `useTuiSurface` since the beginning and never called it,
  so a dialog was invisible to the MCP bridge — the one component an agent most
  needs to know is on screen.

### Changed

- **`Modal` renders as an OVERLAY by default** — absolutely positioned, centred,
  sized from the terminal via the new `size` prop, and opaque. Previously it
  rendered in flow and pushed the layout down.

  **Every existing prop still works** (`id` / `open` / `title` / `children` /
  `onClose`), `title` is still a header shorthand (now optional), escape still
  closes, and the `Close` button is still there. Two things a consumer must
  decide, though:

  1. **Give the app root a height, or pass `inline`.** Ink sizes its output
     canvas from IN-FLOW layout, and an absolutely positioned box that would
     draw past the bottom of that canvas is dropped WITHOUT A WORD. In an app
     whose root is a few lines tall, an overlay modal renders nothing at all.
     Wrap the app in the new `<Screen fullHeight>` (one line), or pass
     `inline` to keep exactly the pre-0.6 rendering. Terminals under
     `OVERLAY_MIN_WIDTH` (24) or `OVERLAY_MIN_HEIGHT` (8) fall back to inline
     on their own.
  2. **An overlay modal is a box of a fixed size.** Ink cannot report a
     subtree's height before laying it out and the fill layer needs an exact
     row count, so the height comes from `size` (`sm`–`xl`, `full`), not from
     the content. Long content wraps inside that box — reach for a larger
     `size` or `inline`.

  If your app already registers a surface with the same `id` as a `Modal`, the
  registry now throws on the duplicate; rename one of them.

- `Modal.Header` / `Modal.Body` / `Modal.Footer` slots, matching
  `react-fancy`'s `Modal`. `closable={false}` drops the escape hint and the
  Close button when you supply your own footer.

### Fixed

- **The package depended on itself.** `@particle-academy/fancy-tui: ^0.3.0` sat
  in `dependencies`, added by accident in 0.3.1 and shipped in every release
  since, so installing this package also installed a second, older copy of it
  nested in your tree. Nothing ever imported it.

  **Nothing to do beyond upgrading** — the stale nested copy disappears on your
  next install. Worth knowing only if you saw two versions of fancy-tui in a
  dependency graph and wondered which one you were getting.

- **`Card.Header` blanked the whole card when given an element.** It wrapped
  its children in `<Text bold>`, and a Box inside a Text does not throw — it
  renders the entire subtree as an EMPTY frame, silently, exactly as a bare
  string inside a Box does. `<Card.Header><Badge/></Card.Header>` produced
  nothing at all. Strings are still bold; elements now pass through and style
  themselves.

### Notes

The interesting discovery behind all of this, recorded so nobody re-derives it:
**Ink's padding is transparent.** Border characters and text overwrite what is
beneath them, but `paddingX` / `paddingY` cells write NOTHING, so a bordered
panel positioned over a layout shows the layout through its own margins —
`│unOVERLAY .│`, where `un` and `.` belong to what is behind. Every overlay
here therefore paints a rectangle of spaces at the same coordinates FIRST and
the panel on top of it, with spaces rather than a `backgroundColor` so the
result stays neutral against any terminal theme. A TUI cannot dim a scrim: there
is no compositing, only overwriting, so "backdrop" means opaque and nothing
more. There is a test per side asserting no background character survives inside
a rendered overlay.

`Modal`, `Drawer` and the Card variants ship with showcase captures like every
other component — real Ink renders, never hand-authored art.

## [0.5.0] — 2026-07-20

### Added

- **`Hero`** — the startup screen every terminal app wants and none should be
  drawing by hand.

  ```tsx
  <Hero
    title="Fancy Docs"
    version="v0.4.0"
    tagline="Browse the Fancy UI registry from your terminal"
    mark={["╭───╮", "│ F │", "╰───╯"]}
    hints={[{ keys: "/", label: "search" }, { keys: "?", label: "help" }]}
  />
  ```

  The brand mark is passed as **data and never padded by hand** — the box is
  drawn by Ink from measured content, so a mark of any width stays aligned.
  That is the specific failure this library's showcase harness exists to
  prevent: four hand-written examples once shipped with 79/78/77-column borders
  inside a single box, because a human counted dashes. There is a test asserting
  every rendered line is the same width across three marks of wildly different
  sizes.

  Degrades deliberately rather than wrapping into rubble: below `compactBelow`
  (default 48 columns) the mark drops **and the border goes with it**, since a
  box drawn around content already at the terminal's edge costs two columns it
  does not have. `asciiMark` swaps in when `capabilities.unicode` is false.

- **`FancyTuiProvider` accepts `width` / `height` overrides.**

  Previously the terminal size came only from `stdout.columns`. That is the
  wrong screen whenever the render target is not this process's own terminal —
  a **server-side render for a browser terminal** knows the client's grid, and
  stdout describes something else entirely. It also lets a test assert
  responsive behaviour without faking a TTY.

  **Nothing breaks:** both props are optional and fall back to stdout exactly as
  before.

### Notes

`Hero` ships with a showcase capture like every other component, so its docs
preview is a real Ink render rather than art.

[Unreleased]: https://github.com/Particle-Academy/fancy-tui/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/Particle-Academy/fancy-tui/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Particle-Academy/fancy-tui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Particle-Academy/fancy-tui/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Particle-Academy/fancy-tui/compare/v0.4.0...v0.5.0
