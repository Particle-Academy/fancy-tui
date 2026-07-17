# @particle-academy/fancy-tui

Ink components for Human+ terminal applications. Fancy TUI mirrors the controlled state, stable handles, JSON-friendly inputs, and bridgeable workflows of Fancy UI while respecting terminal layout and input constraints.

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
