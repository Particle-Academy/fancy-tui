# Using @particle-academy/fancy-tui — guide for agents

How an agent installs and uses this package in a consumer app. What the package
is, is in [README.md](./README.md). Notes for working ON this repo's code are in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Install

```bash
npm install @particle-academy/fancy-tui ink react
```

- **Peers:** `ink ^7.1.0`, `react ^19.2.0`.
- **Node:** `>=22`. ESM only.

## Find it on the Fancy MCP server

The catalog server is `https://ui.particle.academy/mcp` (streamable HTTP, no API
key; MCP id `fancy-ui`). The package's registry entries have `package` =
`fancy-tui`: `fancy-tui` for the package as a whole, and one `tui-<component>`
slug per component (`tui-composer`, `tui-message-list`, `tui-live-region`,
`tui-panel`, `tui-modal`, `tui-table`, ...).

| Need | Tool |
|---|---|
| Is there a terminal component for X? | `search-components` |
| Exact install commands for a slug | `install-instructions` |
| The full source bundle | `get-component` |

## API essentials

- Wrap the app in `<FancyTuiProvider>`.
- **Controlled state.** Interactive components take `value` + `onChange` and an
  explicit stable `id`.
- **Surface registry.** `createTuiSurfaceRegistry()`, `<TuiSurfaceProvider>` and
  `useTuiSurface({ id, kind, read, commands })` make a surface addressable. The
  MCP side is not in this package: `registerTuiBridge` from
  `@particle-academy/agent-integrations/bridges/tui` exposes the registry as
  tools (`tui_surfaces_list`, `tui_surface_read`, `tui_action_invoke`, ...).
- `useFocusManager` is re-exported from Ink, so programmatic focus needs no
  direct `ink` import.
- Subpaths: `/keyboard`, `/markdown`, `/testing`.

## Traps

- **Committed vs live output.** Committed logs and messages go through
  `MessageList` (Ink `Static`); anything still changing belongs below them in
  `<LiveRegion>`.
- **Newlines.** Enter submits multiline inputs. Alt+Enter always inserts a
  newline; Shift+Enter works only once enhanced keyboard reporting is confirmed.
- **Focus is first-come.** Components auto-focus by default; moving focus later
  (opening a modal, switching panes) needs an explicit `focus(id)`.
- Do not add `yoga-layout`; Ink owns it.
