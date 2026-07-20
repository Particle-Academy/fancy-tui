/**
 * Showcase capture — renders every component with real Ink and records the
 * resulting ANSI frame.
 *
 * The alternative, hand-authoring terminal art for docs, does not survive
 * contact with reality: the four hand-written examples on the showcase site
 * had box borders of 79/78/77 columns in a single box, because a human counted
 * dashes. Rendering the actual component makes misalignment impossible and
 * keeps the docs honest when a component changes.
 *
 * Run: npm run showcase  (writes showcase/previews.json)
 */
import React, { type ReactNode } from "react";
import { render } from "ink-testing-library";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FancyTuiProvider } from "../src/theme.js";
import { Box, Card, Column, Header, Panel, Responsive, Row, Screen, Separator, Sidebar, Spacer, Stack, StatusBar, Text, Heading, Hero, KeyHint } from "../src/layout.js";
import { ActivityIndicator, Avatar, Badge, Callout, Profile, Progress, Skeleton, Spinner, Timeline } from "../src/display.js";
import { Autocomplete, Button, Checkbox, CheckboxGroup, DisplayValue, Field, Form, Input, MultilineInput, MultiSwitch, Pillbox, RadioGroup, Select, Slider, Switch } from "../src/inputs.js";
import { Accordion, Breadcrumbs, Command, Menu, Modal, Pagination, Tabs, Toast } from "../src/navigation.js";
import { FileBrowser, Table, TreeNav } from "../src/data.js";
import { CodeView, LiveRegion, Markdown, MessageList, StaticList, ToolCall } from "../src/content.js";

type Entry = {
  slug: string;
  name: string;
  group: string;
  source: string;
  node: ReactNode;
  /** Some components only make sense at a wider viewport. */
  columns?: number;
};

/** Layout width every preview is captured at — matches the docs card. */
const COLUMNS = 68;

const noop = () => {};
const options = [
  { id: "build", label: "Build" },
  { id: "test", label: "Test" },
  { id: "deploy", label: "Deploy" },
];

const entries: Entry[] = [
  // ── Layout ────────────────────────────────────────────────────────────────
  {
    slug: "hero", name: "Hero", group: "Layout", columns: 72,
    source: `<Hero
  title="Fancy Docs"
  version="v0.4.0"
  tagline="Browse the Fancy UI registry from your terminal"
  mark={["╭───╮", "│ F │", "╰───╯"]}
  hints={[{ keys: "/", label: "search" }, { keys: "enter", label: "open" }, { keys: "?", label: "help" }]}
/>`,
    node: <Hero
      title="Fancy Docs"
      version="v0.4.0"
      tagline="Browse the Fancy UI registry from your terminal"
      mark={["╭───╮", "│ F │", "╰───╯"]}
      hints={[{ keys: "/", label: "search" }, { keys: "enter", label: "open" }, { keys: "?", label: "help" }]}
    />,
  },
  {
    slug: "screen", name: "Screen", group: "Layout",
    source: `<Screen>\n  <Header title="Deploy agent" status="connected" />\n  <Text>Ready for instructions.</Text>\n</Screen>`,
    node: <Screen><Header title="Deploy agent" status="connected" /><Text>Ready for instructions.</Text></Screen>,
  },
  {
    slug: "box", name: "Box", group: "Layout",
    source: `<Box borderStyle="round" paddingX={1}>\n  <Text>Typed Ink/Yoga box</Text>\n</Box>`,
    node: <Box borderStyle="round" paddingX={1}><Text>Typed Ink/Yoga box</Text></Box>,
  },
  {
    slug: "stack", name: "Stack", group: "Layout",
    source: `<Stack gap="md">\n  <Text>First</Text>\n  <Text>Second</Text>\n</Stack>`,
    node: <Stack gap="md"><Text>First</Text><Text>Second</Text></Stack>,
  },
  {
    slug: "row", name: "Row", group: "Layout",
    source: `<Row gap="md">\n  <Badge tone="success">ready</Badge>\n  <Text>3 workers</Text>\n</Row>`,
    node: <Row gap="md"><Badge tone="success">ready</Badge><Text>3 workers</Text></Row>,
  },
  {
    slug: "column", name: "Column", group: "Layout",
    source: `<Column gap="sm">\n  <Text>Queued</Text>\n  <Text>Running</Text>\n</Column>`,
    node: <Column gap="sm"><Text>Queued</Text><Text>Running</Text></Column>,
  },
  {
    slug: "spacer", name: "Spacer", group: "Layout",
    source: `<Row>\n  <Text>left</Text>\n  <Spacer />\n  <Text>right</Text>\n</Row>`,
    node: <Row><Text>left</Text><Spacer /><Text>right</Text></Row>,
  },
  {
    slug: "separator", name: "Separator", group: "Layout",
    source: `<Separator label="Workers" />`,
    node: <Separator label="Workers" />,
  },
  {
    slug: "panel", name: "Panel", group: "Layout",
    source: `<Panel title="Run" focused>\n  <Text>Ready for instructions.</Text>\n</Panel>`,
    node: <Panel title="Run" focused><Text>Ready for instructions.</Text></Panel>,
  },
  {
    slug: "card", name: "Card", group: "Layout",
    source: `<Card title="Deploy">\n  <Card.Header>Production</Card.Header>\n  <Card.Body><Text>2 pending approvals.</Text></Card.Body>\n  <Card.Footer><KeyHint keys={["Enter"]} label="approve" /></Card.Footer>\n</Card>`,
    node: <Card title="Deploy"><Card.Header>Production</Card.Header><Card.Body><Text>2 pending approvals.</Text></Card.Body><Card.Footer><KeyHint keys={["Enter"]} label="approve" /></Card.Footer></Card>,
  },
  {
    slug: "header", name: "Header", group: "Layout",
    source: `<Header title="Fancy TUI" subtitle="Human+ terminal" status="connected" />`,
    node: <Header title="Fancy TUI" subtitle="Human+ terminal" status="connected" />,
  },
  {
    slug: "status-bar", name: "StatusBar", group: "Layout",
    source: `<StatusBar left="3 workers" center="main" right="Ctrl+R refresh" />`,
    node: <StatusBar left="3 workers" center="main" right="Ctrl+R refresh" />,
  },
  {
    slug: "responsive", name: "Responsive", group: "Layout",
    source: `<Responsive below={80} fallback={<Text>narrow layout</Text>}>\n  <Text>wide layout</Text>\n</Responsive>`,
    node: <Responsive below={80} fallback={<Text>narrow layout</Text>}><Text>wide layout</Text></Responsive>,
  },
  {
    slug: "sidebar", name: "Sidebar", group: "Layout",
    source: `<Sidebar items={items} activeId="test" onChange={setActive} />`,
    node: <Sidebar items={options} activeId="test" onChange={noop} />,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  {
    slug: "text", name: "Text", group: "Content",
    source: `<Stack gap={0}>\n  <Text>Default</Text>\n  <Text tone="muted">Muted</Text>\n  <Text tone="danger">Danger</Text>\n</Stack>`,
    node: <Stack gap={0}><Text>Default</Text><Text tone="muted">Muted</Text><Text tone="danger">Danger</Text></Stack>,
  },
  {
    slug: "heading", name: "Heading", group: "Content",
    source: `<Stack gap={0}>\n  <Heading level={1}>Pipeline</Heading>\n  <Heading level={2}>Workers</Heading>\n</Stack>`,
    node: <Stack gap={0}><Heading level={1}>Pipeline</Heading><Heading level={2}>Workers</Heading></Stack>,
  },
  {
    slug: "key-hint", name: "KeyHint", group: "Content",
    source: `<Row gap="md">\n  <KeyHint keys={["Tab"]} label="focus" />\n  <KeyHint keys={["Alt", "Enter"]} label="newline" />\n</Row>`,
    node: <Row gap="md"><KeyHint keys={["Tab"]} label="focus" /><KeyHint keys={["Alt", "Enter"]} label="newline" /></Row>,
  },
  {
    slug: "markdown", name: "Markdown", group: "Content",
    source: `<Markdown>{"## Result\\n\\nThe build **passed** with \`0\` warnings."}</Markdown>`,
    node: <Markdown>{"## Result\n\nThe build **passed** with `0` warnings."}</Markdown>,
  },
  {
    slug: "code-view", name: "CodeView", group: "Content",
    source: `<CodeView language="ts" lineNumbers code={"const x = 1;\\nexport default x;"} />`,
    node: <CodeView language="ts" lineNumbers code={"const x = 1;\nexport default x;"} />,
  },

  // ── Display ───────────────────────────────────────────────────────────────
  {
    slug: "badge", name: "Badge", group: "Display",
    source: `<Row gap="sm">\n  <Badge tone="success">passing</Badge>\n  <Badge tone="warning">flaky</Badge>\n  <Badge tone="danger">failed</Badge>\n</Row>`,
    node: <Row gap="sm"><Badge tone="success">passing</Badge><Badge tone="warning">flaky</Badge><Badge tone="danger">failed</Badge></Row>,
  },
  {
    slug: "callout", name: "Callout", group: "Display",
    source: `<Callout title="Heads up" tone="warning">\n  Destructive actions wait for human confirmation.\n</Callout>`,
    node: <Callout title="Heads up" tone="warning">Destructive actions wait for human confirmation.</Callout>,
  },
  {
    slug: "spinner", name: "Spinner", group: "Display",
    source: `<Spinner label="thinking…" />`,
    node: <Spinner label="thinking…" />,
  },
  {
    slug: "progress", name: "Progress", group: "Display",
    source: `<Progress value={72} label="context" />`,
    node: <Progress value={72} label="context" />,
  },
  {
    slug: "skeleton", name: "Skeleton", group: "Display",
    source: `<Skeleton width={24} />`,
    node: <Skeleton width={24} />,
  },
  {
    slug: "avatar", name: "Avatar", group: "Display",
    source: `<Avatar name="Codex" glyph="◆" />`,
    node: <Avatar name="Codex" glyph="◆" />,
  },
  {
    slug: "profile", name: "Profile", group: "Display",
    source: `<Profile name="Codex" subtitle="agent · connected" glyph="◆" />`,
    node: <Profile name="Codex" subtitle="agent · connected" glyph="◆" />,
  },
  {
    slug: "activity-indicator", name: "ActivityIndicator", group: "Display",
    source: `<ActivityIndicator status="pending" label="integration" />`,
    node: <ActivityIndicator status="pending" label="integration" />,
  },
  {
    slug: "timeline", name: "Timeline", group: "Display",
    source: `<Timeline items={[\n  { id: "a", title: "queued", detail: "12.4s", tone: "success" },\n  { id: "b", title: "building", detail: "8.1s", tone: "warning" },\n  { id: "c", title: "deploy" },\n]} />`,
    node: <Timeline items={[{ id: "a", title: "queued", detail: "12.4s", tone: "success" }, { id: "b", title: "building", detail: "8.1s", tone: "warning" }, { id: "c", title: "deploy" }]} />,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  {
    slug: "button", name: "Button", group: "Inputs",
    source: `<Row gap="md">\n  <Button id="run" onPress={run}>Run</Button>\n  <Button id="stop" tone="danger" onPress={stop}>Stop</Button>\n</Row>`,
    node: <Row gap="md"><Button id="run" onPress={noop}>Run</Button><Button id="stop" tone="danger" onPress={noop} autoFocus={false}>Stop</Button></Row>,
  },
  {
    slug: "form", name: "Form", group: "Inputs",
    source: `<Form>\n  <Field label="Branch"><Input id="branch" value={value} onChange={setValue} /></Field>\n</Form>`,
    node: <Form><Field label="Branch"><Input id="branch" value="main" onChange={noop} /></Field></Form>,
  },
  {
    slug: "field", name: "Field", group: "Inputs",
    source: `<Field label="Token" description="Stored in your keychain." error="Required">\n  <Input id="token" value="" onChange={setValue} />\n</Field>`,
    node: <Field label="Token" description="Stored in your keychain." error="Required"><Input id="token" value="" onChange={noop} placeholder="paste token" /></Field>,
  },
  {
    slug: "display-value", name: "DisplayValue", group: "Inputs",
    source: `<DisplayValue label="Branch" value="main" />`,
    node: <DisplayValue label="Branch" value="main" />,
  },
  {
    slug: "input", name: "Input", group: "Inputs",
    source: `<Input id="branch" value={value} onChange={setValue} placeholder="branch name" />`,
    node: <Input id="branch" value="main" onChange={noop} placeholder="branch name" />,
  },
  {
    slug: "multiline-input", name: "MultilineInput", group: "Inputs",
    source: `<MultilineInput id="prompt" value={value} onChange={setValue} placeholder="Message…" />`,
    node: <MultilineInput id="prompt" value="Summarize the failing build" onChange={noop} placeholder="Message…" />,
  },
  {
    slug: "checkbox", name: "Checkbox", group: "Inputs",
    source: `<Checkbox id="ci" checked={checked} onChange={setChecked} label="Run in CI" />`,
    node: <Checkbox id="ci" checked onChange={noop} label="Run in CI" />,
  },
  {
    slug: "checkbox-group", name: "CheckboxGroup", group: "Inputs",
    source: `<CheckboxGroup id="steps" value={["build"]} onChange={setSteps} options={options} />`,
    node: <CheckboxGroup id="steps" value={["build"]} onChange={noop} options={options} />,
  },
  {
    slug: "radio-group", name: "RadioGroup", group: "Inputs",
    source: `<RadioGroup id="env" value="test" onChange={setEnv} options={options} />`,
    node: <RadioGroup id="env" value="test" onChange={noop} options={options} />,
  },
  {
    slug: "switch", name: "Switch", group: "Inputs",
    source: `<Switch id="verbose" checked={on} onChange={setOn} label="Verbose" />`,
    node: <Switch id="verbose" checked onChange={noop} label="Verbose" />,
  },
  {
    slug: "multi-switch", name: "MultiSwitch", group: "Inputs",
    source: `<MultiSwitch id="mode" value="test" onChange={setMode} options={options} />`,
    node: <MultiSwitch id="mode" value="test" onChange={noop} options={options} />,
  },
  {
    slug: "select", name: "Select", group: "Inputs",
    source: `<Select id="target" value="deploy" onChange={setTarget} options={options} />`,
    node: <Select id="target" value="deploy" onChange={noop} options={options} />,
  },
  {
    slug: "autocomplete", name: "Autocomplete", group: "Inputs",
    source: `<Autocomplete id="cmd" query={query} onQueryChange={setQuery} value={value} onChange={setValue} options={options} />`,
    node: <Autocomplete id="cmd" query="te" onQueryChange={noop} value="test" onChange={noop} options={options} />,
  },
  {
    slug: "pillbox", name: "Pillbox", group: "Inputs",
    source: `<Pillbox id="tags" value={["ci", "nightly"]} onChange={setTags} inputValue={draft} onInputChange={setDraft} />`,
    node: <Pillbox id="tags" value={["ci", "nightly"]} onChange={noop} inputValue="" onInputChange={noop} />,
  },
  {
    slug: "slider", name: "Slider", group: "Inputs",
    source: `<Slider id="threshold" value={60} onChange={setValue} />`,
    node: <Slider id="threshold" value={60} onChange={noop} />,
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  {
    slug: "tabs", name: "Tabs", group: "Navigation",
    source: `<Tabs id="views" value="test" onChange={setTab} tabs={options} />`,
    node: <Tabs id="views" value="test" onChange={noop} tabs={options} />,
  },
  {
    slug: "accordion", name: "Accordion", group: "Navigation",
    source: `<Accordion id="sections" value={["build"]} onChange={setOpen} items={[\n  { id: "build", label: "Build", content: "Compiles the workspace." },\n]} />`,
    node: <Accordion id="sections" value={["build"]} onChange={noop} items={[{ id: "build", label: "Build", content: "Compiles the workspace." }, { id: "test", label: "Test", content: "Runs the suite." }]} />,
  },
  {
    slug: "breadcrumbs", name: "Breadcrumbs", group: "Navigation",
    source: `<Breadcrumbs items={[{ id: "root", label: "repo" }, { id: "src", label: "src" }]} />`,
    node: <Breadcrumbs items={[{ id: "root", label: "repo" }, { id: "src", label: "src" }, { id: "f", label: "index.ts" }]} />,
  },
  {
    slug: "pagination", name: "Pagination", group: "Navigation",
    source: `<Pagination id="jobs" page={2} pages={5} onChange={setPage} />`,
    node: <Pagination id="jobs" page={2} pages={5} onChange={noop} />,
  },
  {
    slug: "menu", name: "Menu", group: "Navigation",
    source: `<Menu id="actions" value="test" onChange={setValue} items={options} />`,
    node: <Menu id="actions" value="test" onChange={noop} items={options} />,
  },
  {
    slug: "modal", name: "Modal", group: "Navigation",
    source: `<Modal id="confirm" open title="Deploy to production?" onClose={close}>\n  <Text>This action requires confirmation.</Text>\n</Modal>`,
    node: <Modal id="confirm" open title="Deploy to production?" onClose={noop}><Text>This action requires confirmation.</Text></Modal>,
  },
  {
    slug: "command", name: "Command", group: "Navigation",
    source: `<Command id="palette" query={query} onQueryChange={setQuery} commands={options} onSelect={run} />`,
    node: <Command id="palette" query="" onQueryChange={noop} commands={options} onSelect={noop} />,
  },
  {
    slug: "toast", name: "Toast", group: "Navigation",
    source: `<Toast items={[{ id: "t1", message: "Deployed", tone: "success" }]} />`,
    node: <Toast items={[{ id: "t1", message: "Deployed to production", tone: "success" }]} />,
  },

  // ── Data ──────────────────────────────────────────────────────────────────
  {
    slug: "table", name: "Table", group: "Data",
    source: `<Table id="jobs" rows={rows} rowId={(r) => r.id} columns={[\n  { id: "job", header: "JOB", render: (r) => r.job },\n  { id: "state", header: "STATE", render: (r) => r.state },\n]} />`,
    node: (
      <Table
        id="jobs"
        rows={[{ id: "1", job: "compile", state: "success" }, { id: "2", job: "integration", state: "running" }]}
        rowId={(r: any) => r.id}
        columns={[
          { id: "job", header: "JOB", render: (r: any) => r.job },
          { id: "state", header: "STATE", render: (r: any) => r.state },
        ]}
        selectedIds={["2"]}
      />
    ),
  },
  {
    slug: "static-list", name: "StaticList", group: "Data",
    source: `<StaticList items={logs} getKey={(l) => l.id} renderItem={(l) => <Text>{l.line}</Text>} />`,
    node: <StaticList items={[{ id: "1", line: "build started" }, { id: "2", line: "build finished" }]} getKey={(l: any) => l.id} renderItem={(l: any) => <Text>{l.line}</Text>} />,
  },
  {
    slug: "tree-nav", name: "TreeNav", group: "Data",
    source: `<TreeNav id="tree" nodes={nodes} expandedIds={["src"]} selectedId="index" onExpandedChange={setOpen} onSelect={setSel} />`,
    node: <TreeNav id="tree" nodes={[{ id: "src", label: "src", children: [{ id: "index", label: "index.ts" }] }]} expandedIds={["src"]} selectedId="index" onExpandedChange={noop} onSelect={noop} />,
  },
  {
    slug: "file-browser", name: "FileBrowser", group: "Data",
    source: `<FileBrowser id="files" path="/repo" entries={entries} selectedId="a" onPathChange={setPath} onSelect={setSel} />`,
    node: <FileBrowser id="files" path="/repo" entries={[{ id: "a", name: "src", kind: "directory" as const }, { id: "b", name: "package.json", kind: "file" as const }]} selectedId="a" onPathChange={noop} onSelect={noop} />,
  },

  // ── Human+ ────────────────────────────────────────────────────────────────
  {
    slug: "message-list", name: "MessageList", group: "Human+",
    source: `<MessageList messages={[\n  { id: "1", role: "user", content: "Summarize the failing build." },\n  { id: "2", role: "agent", content: "A missing baseUrl breaks the paths." },\n]} />`,
    node: <MessageList messages={[{ id: "1", role: "user" as const, content: "Summarize the failing build." }, { id: "2", role: "agent" as const, content: "A missing baseUrl breaks the paths." }]} />,
  },
  {
    slug: "live-region", name: "LiveRegion", group: "Human+",
    source: `<LiveRegion>\n  <Spinner label="thinking…" />\n</LiveRegion>`,
    node: <LiveRegion><Spinner label="thinking…" /></LiveRegion>,
  },
  {
    slug: "tool-call", name: "ToolCall", group: "Human+",
    source: `<ToolCall call={{ id: "t1", name: "inspect_config", status: "pending", detail: "tsconfig.json" }} />`,
    node: <ToolCall call={{ id: "t1", name: "inspect_config", status: "pending" as const, detail: "tsconfig.json" }} />,
  },
  {
    slug: "composer", name: "Composer", group: "Human+",
    source: `<Composer id="prompt" value={value} onChange={setValue} onSubmit={send} placeholder="Message…" />`,
    node: <MultilineInput id="prompt" value="" onChange={noop} placeholder="Message…" />,
  },
  {
    slug: "fancy-tui-provider", name: "FancyTuiProvider", group: "Human+",
    source: `<FancyTuiProvider>\n  <Header title="Deploy agent" status="connected" />\n  <Panel title="Run"><Text>Ready for instructions.</Text></Panel>\n</FancyTuiProvider>`,
    // A bare Fragment renders nothing through ink-testing-library — Ink needs a
    // layout node to measure against, so wrap the pair in a Stack.
    node: <Stack gap="sm"><Header title="Deploy agent" status="connected" /><Panel title="Run"><Text>Ready for instructions.</Text></Panel></Stack>,
  },
];

const settle = () => new Promise((r) => setTimeout(r, 30));

async function main() {
  // Ink/chalk decide colour support at import time and disable it when stdout
  // is not a TTY — which it never is here. Re-exec once with FORCE_COLOR set so
  // the captured frames carry real ANSI instead of plain text. Doing it here
  // rather than in the npm script keeps this working on Windows shells, where
  // a `FORCE_COLOR=3 node …` prefix is not valid syntax.
  if (!process.env.FORCE_COLOR) {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      stdio: "inherit",
      env: { ...process.env, FORCE_COLOR: "3" },
    });
    process.exit(result.status ?? 1);
  }

  const out: Array<Record<string, unknown>> = [];
  for (const entry of entries) {
    // Constrain layout to the documented width. Ink otherwise fills the
    // harness' default 100 columns, and a docs site rendering the frame in a
    // narrower pane would clip every border.
    const view = render(
      <FancyTuiProvider>
        <Box width={COLUMNS} flexDirection="column">{entry.node}</Box>
      </FancyTuiProvider>,
    );
    await settle();
    const frame = view.lastFrame() ?? "";
    view.unmount();
    if (!frame.trim()) {
      console.error(`  !! ${entry.slug} rendered an empty frame`);
    }
    out.push({ slug: entry.slug, name: entry.name, group: entry.group, source: entry.source, frame, columns: COLUMNS });
    console.log(`  ✓ ${entry.name}`);
  }

  // Resolve against the package root, not the compiled script's location —
  // this file runs from .showcase-dist/scripts/, so a relative hop would bury
  // the artifact inside the build output.
  const dir = resolve(process.cwd(), "showcase");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "previews.json");
  writeFileSync(file, JSON.stringify({ generated: true, components: out }, null, 2) + "\n");
  console.log(`\nCaptured ${out.length} components → ${file}`);
}

void main();
