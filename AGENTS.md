# Fancy TUI contributor guide

Fancy TUI is the Ink 7 terminal sibling of `@particle-academy/react-fancy`.

- Target Node 22 and React 19.2.
- Ink owns Yoga; do not depend on `yoga-layout` directly.
- Interactive components require explicit stable `id` values, controlled state, JSON-friendly inputs, and registry commands.
- Keep MCP out of this package. `@particle-academy/agent-integrations/bridges/tui` adapts the renderer-neutral surface registry.
- Enter submits multiline inputs. Alt+Enter always inserts a newline; Shift+Enter only works after enhanced keyboard support is confirmed.
- Committed logs/messages use Ink `Static`; changing live state belongs below them in `LiveRegion`.
- Add model tests before renderer behavior. Run `npm test && npm run lint && npm run build` before release.
