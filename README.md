# @particle-academy/fancy-tui

[![Fancified](art/fancified.svg)](https://particle.academy)

Ink components for Human+ terminal applications. Fancy TUI mirrors the controlled state, stable handles, JSON-friendly inputs, and bridgeable workflows of the Fancy Dev Kit while respecting terminal layout and input constraints.

```tsx
import { FancyTuiProvider, Panel, MessageList, LiveRegion, Spinner, Composer } from "@particle-academy/fancy-tui";

<FancyTuiProvider>
  <Panel title="Agent">
    <MessageList messages={messages} />
    <LiveRegion>{thinking && <Spinner label="thinking…" />}</LiveRegion>
    <Composer id="prompt" value={prompt} onChange={setPrompt} onSubmit={send} />
  </Panel>
</FancyTuiProvider>
```

Requires Node 22, React 19.2, and Ink 7. Alt+Enter inserts a newline everywhere; Shift+Enter is enabled only when enhanced keyboard reporting is available.

<!-- fancy-agents-note:start -->
> **For agents.** This package is listed on the Fancy MCP catalog server at
> `https://ui.particle.academy/mcp` (streamable HTTP, no API key; MCP id `fancy-ui`),
> with install commands and docs, alongside the rest of the kit. How an agent
> installs and uses this package is in [AGENTS.md](https://github.com/Particle-Academy/fancy-tui/blob/main/AGENTS.md).
<!-- fancy-agents-note:end -->
