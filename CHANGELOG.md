# Changelog

All notable changes to `@particle-academy/fancy-tui` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0:** breaking changes land in MINOR releases. Read the entry, not the
> version number.

## [Unreleased]

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

[Unreleased]: https://github.com/Particle-Academy/fancy-tui/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/Particle-Academy/fancy-tui/compare/v0.4.0...v0.5.0
