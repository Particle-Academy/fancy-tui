/**
 * The showcase example table — one live React node per component.
 *
 * This is the SOURCE of every component preview in the docs. Two consumers read
 * it, and they need different things:
 *
 *  - A Node/Ink host (the docs TUI) imports `SHOWCASE_EXAMPLES` and renders
 *    `example.node` inline in its own Ink tree. The preview is then the real
 *    component, laid out by Yoga at the host's actual terminal size — not a
 *    picture of one.
 *  - A non-Node consumer (the web gallery) cannot run Ink, so
 *    `scripts/showcase.tsx` renders this same table once at build time and
 *    writes `showcase/previews.json`. Those frames are a DERIVED artifact.
 *
 * Keeping the table here rather than in the build script is what makes the
 * first consumer possible: a script is not importable.
 *
 * Why real nodes at all: hand-authoring terminal art does not survive contact
 * with reality — the four hand-written examples the showcase site started with
 * had box borders of 79/78/77 columns inside a single box, because a human
 * counted dashes. Rendering the actual component makes misalignment impossible.
 */
import React, { useState, type ReactNode } from "react";

import { Box, Card, Column, Header, Panel, Responsive, Row, Screen, Separator, Sidebar, Spacer, Stack, StatusBar, Text, Heading, Hero, KeyHint } from "./layout.js";
import { ActivityIndicator, Avatar, Badge, Callout, Profile, Progress, Skeleton, Spinner, Timeline } from "./display.js";
import { Autocomplete, Button, Checkbox, CheckboxGroup, DisplayValue, Field, Form, Input, MultilineInput, MultiSwitch, Pillbox, RadioGroup, Select, Slider, Switch } from "./inputs.js";
import { Accordion, Breadcrumbs, Command, Menu, Modal, Pagination, Tabs, Toast } from "./navigation.js";
import { Drawer } from "./overlay.js";
import { FileBrowser, Table, TreeNav } from "./data.js";
import { CodeView, LiveRegion, Markdown, MessageList, StaticList, ToolCall } from "./content.js";

export type ShowcaseExample = {
  /** Stable id, also the key `showcase/previews.json` is written under. */
  slug: string;
  /** Display name, as the docs title it. */
  name: string;
  /** Docs section: Layout / Content / Display / Inputs / Navigation / Data / Human+. */
  group: string;
  /** The snippet shown beside the preview — what a reader would type. */
  source: string;
  /** The live example. Render it; do not describe it. */
  node: ReactNode;
  /**
   * Width this example is composed for, when it is wider than
   * `SHOWCASE_COLUMNS`. Advisory: a host that has less room should clamp rather
   * than refuse, and the capture script normalises every frame to
   * `SHOWCASE_COLUMNS` so the docs cards all line up.
   */
  columns?: number;
  /**
   * The example commits rows through Ink's `<Static>` — the mechanism that puts
   * finished messages and log lines into real terminal scrollback.
   *
   * **A windowed host must render this one from its capture, not live.** Static
   * output is written ABOVE the live frame and outside the box model entirely,
   * so no amount of `height` + `overflow: hidden` around it clips anything: the
   * rows land on top of the host's own header and make the frame taller than
   * the terminal. That is `Static` working as designed — it is just
   * incompatible with a pane that repaints a fixed-size screen.
   */
  scrollback?: boolean;
  /**
   * The example responds to keyboard input on its own.
   *
   * When `true`, `node` is a self-contained stateful component: it owns its
   * `value` with `useState` and passes a REAL `onChange`, so a host that renders
   * it persistently and forwards keystrokes gets a live control — the accordion
   * actually opens, the input actually types — instead of a frozen snapshot with
   * a no-op handler. The interactive controls auto-focus (see `autoFocus` on
   * `InteractiveProps`), so an example rendered on its own is ready for input
   * immediately, with no focus competition.
   *
   * Unset/`false` marks a purely visual example (Badge, Separator, Heading, Hero,
   * Card, …), a display component with controlled props but no keyboard handling
   * of its own (Table, TreeNav, FileBrowser, Sidebar — they respond to agent
   * commands, not keystrokes), and the two `scrollback` lists, which have nothing
   * to type into.
   *
   * Orthogonal to the capture: a stateful example renders its INITIAL state, so
   * `showcase/previews.json` is byte-identical to the frozen version. This flag
   * only tells a live host which previews are worth focusing and feeding input.
   */
  interactive?: boolean;
};

/** Layout width every captured preview is normalised to — matches the docs card. */
export const SHOWCASE_COLUMNS = 68;

const noop = () => {};
const options = [
  { id: "build", label: "Build" },
  { id: "test", label: "Test" },
  { id: "deploy", label: "Deploy" },
];

/*
 * Interactive example nodes.
 *
 * Each is a small self-contained component that owns its state with `useState`
 * and passes a REAL `onChange`/`onPress`/`onClose`, so it responds to input on
 * its own — the whole point of a live example over a captured frame. The
 * `source` snippet beside each shows the idiomatic controlled `value`+`onChange`
 * a real user would write; these wrappers are the demo scaffolding.
 *
 * Initial state MIRRORS the frozen values these replaced, so every captured
 * preview in `showcase/previews.json` renders byte-for-byte the same first
 * frame. Change a starting value and you change the capture.
 */

function ButtonDemo() {
  // A Button's press is an external action; the buttons still respond to Tab,
  // which moves focus between them (the `inverse` cell shifts visibly).
  const [, setPresses] = useState(0);
  return (
    <Row gap="md">
      <Button id="run" onPress={() => setPresses((n) => n + 1)}>Run</Button>
      <Button id="stop" tone="danger" onPress={() => setPresses(0)} autoFocus={false}>Stop</Button>
    </Row>
  );
}

function FormDemo() {
  const [branch, setBranch] = useState("main");
  return <Form><Field label="Branch"><Input id="branch" value={branch} onChange={setBranch} /></Field></Form>;
}

function FieldDemo() {
  const [token, setToken] = useState("");
  return <Field label="Token" description="Stored in your keychain." error="Required"><Input id="token" value={token} onChange={setToken} placeholder="paste token" /></Field>;
}

function InputDemo() {
  const [value, setValue] = useState("main");
  return <Input id="branch" value={value} onChange={setValue} placeholder="branch name" />;
}

function MultilineInputDemo() {
  const [value, setValue] = useState("Summarize the failing build");
  return <MultilineInput id="prompt" value={value} onChange={setValue} placeholder="Message…" />;
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return <Checkbox id="ci" checked={checked} onChange={setChecked} label="Run in CI" />;
}

function CheckboxGroupDemo() {
  const [value, setValue] = useState<string[]>(["build"]);
  return <CheckboxGroup id="steps" value={value} onChange={setValue} options={options} />;
}

function RadioGroupDemo() {
  const [value, setValue] = useState("test");
  return <RadioGroup id="env" value={value} onChange={setValue} options={options} />;
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return <Switch id="verbose" checked={on} onChange={setOn} label="Verbose" />;
}

function MultiSwitchDemo() {
  const [value, setValue] = useState("test");
  return <MultiSwitch id="mode" value={value} onChange={setValue} options={options} />;
}

function SelectDemo() {
  const [value, setValue] = useState("deploy");
  return <Select id="target" value={value} onChange={setValue} options={options} />;
}

function AutocompleteDemo() {
  const [query, setQuery] = useState("te");
  const [value, setValue] = useState("test");
  return <Autocomplete id="cmd" query={query} onQueryChange={setQuery} value={value} onChange={setValue} options={options} />;
}

function PillboxDemo() {
  const [value, setValue] = useState<string[]>(["ci", "nightly"]);
  const [draft, setDraft] = useState("");
  return <Pillbox id="tags" value={value} onChange={setValue} inputValue={draft} onInputChange={setDraft} />;
}

function SliderDemo() {
  const [value, setValue] = useState(60);
  return <Slider id="threshold" value={value} onChange={setValue} />;
}

function TabsDemo() {
  const [value, setValue] = useState("test");
  return <Tabs id="views" value={value} onChange={setValue} tabs={options} />;
}

function AccordionDemo() {
  const [open, setOpen] = useState<string[]>(["build"]);
  return (
    <Accordion
      id="sections"
      value={open}
      onChange={setOpen}
      items={[
        { id: "build", label: "Build", content: "Compiles the workspace." },
        { id: "test", label: "Test", content: "Runs the suite." },
      ]}
    />
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(2);
  return <Pagination id="jobs" page={page} pages={5} onChange={setPage} />;
}

function MenuDemo() {
  const [value, setValue] = useState("test");
  return <Menu id="actions" value={value} onChange={setValue} items={options} />;
}

function CommandDemo() {
  // `Command` drives its own filtered list off `query`; the command buttons
  // respond to Tab and select via `onSelect`.
  const [query, setQuery] = useState("");
  const [, setSelected] = useState<string | null>(null);
  return <Command id="palette" query={query} onQueryChange={setQuery} commands={options} onSelect={setSelected} />;
}

function ModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Box width={SHOWCASE_COLUMNS} height={12} flexDirection="column">
      <Header title="Deploy agent" status="connected" />
      <Text>2 approvals pending · main@8f2c1d</Text>
      <Text tone="muted">worker-01 · worker-02 · worker-03 · worker-04 · idle</Text>
      <Text tone="muted">queued: compile, integration, package, publish, notify</Text>
      <Modal id="confirm" open={open} title="Deploy to production?" bounds={{ width: SHOWCASE_COLUMNS, height: 12 }} onClose={() => setOpen(false)}>
        <Text>This replaces 3 running services.</Text>
      </Modal>
    </Box>
  );
}

function DrawerDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Box width={SHOWCASE_COLUMNS} height={10} flexDirection="column">
      <Header title="Jobs" status="3 running" />
      <Text tone="muted">compile · integration · package · publish · notify</Text>
      <Text tone="muted">worker-01 · worker-02 · worker-03 · worker-04 · idle</Text>
      <Text tone="muted">retries: 2 · queue depth: 11 · oldest: 4m12s</Text>
      <Drawer id="filters" open={open} side="right" size="md" title="Filters" bounds={{ width: SHOWCASE_COLUMNS, height: 10 }} onClose={() => setOpen(false)}>
        <Drawer.Body><Text>state: failing</Text><Text>branch: main</Text></Drawer.Body>
        <Drawer.Footer><Text tone="muted">enter apply</Text></Drawer.Footer>
      </Drawer>
    </Box>
  );
}

function ComposerDemo() {
  const [value, setValue] = useState("");
  return <MultilineInput id="prompt" value={value} onChange={setValue} placeholder="Message…" />;
}

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = [
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
    slug: "card-variants", name: "Card variants", group: "Layout",
    source: `<Row gap="sm">\n  <Card variant="outlined"><Text>outlined</Text></Card>\n  <Card variant="elevated"><Text>elevated</Text></Card>\n  <Card variant="flat"><Text>flat</Text></Card>\n</Row>`,
    node: <Row gap="sm"><Card variant="outlined"><Text>outlined</Text></Card><Card variant="elevated"><Text>elevated</Text></Card><Card variant="flat"><Text>flat</Text></Card></Row>,
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
    node: <ButtonDemo />, interactive: true,
  },
  {
    slug: "form", name: "Form", group: "Inputs",
    source: `<Form>\n  <Field label="Branch"><Input id="branch" value={value} onChange={setValue} /></Field>\n</Form>`,
    node: <FormDemo />, interactive: true,
  },
  {
    slug: "field", name: "Field", group: "Inputs",
    source: `<Field label="Token" description="Stored in your keychain." error="Required">\n  <Input id="token" value="" onChange={setValue} />\n</Field>`,
    node: <FieldDemo />, interactive: true,
  },
  {
    slug: "display-value", name: "DisplayValue", group: "Inputs",
    source: `<DisplayValue label="Branch" value="main" />`,
    node: <DisplayValue label="Branch" value="main" />,
  },
  {
    slug: "input", name: "Input", group: "Inputs",
    source: `<Input id="branch" value={value} onChange={setValue} placeholder="branch name" />`,
    node: <InputDemo />, interactive: true,
  },
  {
    slug: "multiline-input", name: "MultilineInput", group: "Inputs",
    source: `<MultilineInput id="prompt" value={value} onChange={setValue} placeholder="Message…" />`,
    node: <MultilineInputDemo />, interactive: true,
  },
  {
    slug: "checkbox", name: "Checkbox", group: "Inputs",
    source: `<Checkbox id="ci" checked={checked} onChange={setChecked} label="Run in CI" />`,
    node: <CheckboxDemo />, interactive: true,
  },
  {
    slug: "checkbox-group", name: "CheckboxGroup", group: "Inputs",
    source: `<CheckboxGroup id="steps" value={["build"]} onChange={setSteps} options={options} />`,
    node: <CheckboxGroupDemo />, interactive: true,
  },
  {
    slug: "radio-group", name: "RadioGroup", group: "Inputs",
    source: `<RadioGroup id="env" value="test" onChange={setEnv} options={options} />`,
    node: <RadioGroupDemo />, interactive: true,
  },
  {
    slug: "switch", name: "Switch", group: "Inputs",
    source: `<Switch id="verbose" checked={on} onChange={setOn} label="Verbose" />`,
    node: <SwitchDemo />, interactive: true,
  },
  {
    slug: "multi-switch", name: "MultiSwitch", group: "Inputs",
    source: `<MultiSwitch id="mode" value="test" onChange={setMode} options={options} />`,
    node: <MultiSwitchDemo />, interactive: true,
  },
  {
    slug: "select", name: "Select", group: "Inputs",
    source: `<Select id="target" value="deploy" onChange={setTarget} options={options} />`,
    node: <SelectDemo />, interactive: true,
  },
  {
    slug: "autocomplete", name: "Autocomplete", group: "Inputs",
    source: `<Autocomplete id="cmd" query={query} onQueryChange={setQuery} value={value} onChange={setValue} options={options} />`,
    node: <AutocompleteDemo />, interactive: true,
  },
  {
    slug: "pillbox", name: "Pillbox", group: "Inputs",
    source: `<Pillbox id="tags" value={["ci", "nightly"]} onChange={setTags} inputValue={draft} onInputChange={setDraft} />`,
    node: <PillboxDemo />, interactive: true,
  },
  {
    slug: "slider", name: "Slider", group: "Inputs",
    source: `<Slider id="threshold" value={60} onChange={setValue} />`,
    node: <SliderDemo />, interactive: true,
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  {
    slug: "tabs", name: "Tabs", group: "Navigation",
    source: `<Tabs id="views" value="test" onChange={setTab} tabs={options} />`,
    node: <TabsDemo />, interactive: true,
  },
  {
    slug: "accordion", name: "Accordion", group: "Navigation",
    source: `<Accordion id="sections" value={["build"]} onChange={setOpen} items={[\n  { id: "build", label: "Build", content: "Compiles the workspace." },\n]} />`,
    node: <AccordionDemo />, interactive: true,
  },
  {
    slug: "breadcrumbs", name: "Breadcrumbs", group: "Navigation",
    source: `<Breadcrumbs items={[{ id: "root", label: "repo" }, { id: "src", label: "src" }]} />`,
    node: <Breadcrumbs items={[{ id: "root", label: "repo" }, { id: "src", label: "src" }, { id: "f", label: "index.ts" }]} />,
  },
  {
    slug: "pagination", name: "Pagination", group: "Navigation",
    source: `<Pagination id="jobs" page={2} pages={5} onChange={setPage} />`,
    node: <PaginationDemo />, interactive: true,
  },
  {
    slug: "menu", name: "Menu", group: "Navigation",
    source: `<Menu id="actions" value="test" onChange={setValue} items={options} />`,
    node: <MenuDemo />, interactive: true,
  },
  {
    // Composed inside an explicitly sized Box with matching `bounds`: an overlay
    // paints only on rows the layout owns, and both hosts of this table wrap the
    // example in a content-height container. In an app that role is played by
    // `<Screen fullHeight>`, which is what the source shows.
    slug: "modal", name: "Modal", group: "Navigation",
    source: `<Screen fullHeight>\n  <Header title="Deploy agent" status="connected" />\n  <Text>2 approvals pending · main@8f2c1d</Text>\n\n  <Modal id="confirm" open title="Deploy to production?" onClose={close}>\n    <Text>This replaces 3 running services.</Text>\n  </Modal>\n</Screen>`,
    node: <ModalDemo />, interactive: true,
  },
  {
    slug: "drawer", name: "Drawer", group: "Navigation",
    source: `<Drawer id="filters" open side="right" size="md" title="Filters" onClose={close}>\n  <Drawer.Body>\n    <Text>state: failing</Text>\n    <Text>branch: main</Text>\n  </Drawer.Body>\n  <Drawer.Footer><Text tone="muted">enter apply</Text></Drawer.Footer>\n</Drawer>`,
    node: <DrawerDemo />, interactive: true,
  },
  {
    slug: "command", name: "Command", group: "Navigation",
    source: `<Command id="palette" query={query} onQueryChange={setQuery} commands={options} onSelect={run} />`,
    node: <CommandDemo />, interactive: true,
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
        rowId={(r) => r.id}
        columns={[
          { id: "job", header: "JOB", render: (r) => r.job },
          { id: "state", header: "STATE", render: (r) => r.state },
        ]}
        selectedIds={["2"]}
      />
    ),
  },
  {
    slug: "static-list", name: "StaticList", group: "Data", scrollback: true,
    source: `<StaticList items={logs} getKey={(l) => l.id} renderItem={(l) => <Text>{l.line}</Text>} />`,
    node: <StaticList items={[{ id: "1", line: "build started" }, { id: "2", line: "build finished" }]} getKey={(l) => l.id} renderItem={(l) => <Text>{l.line}</Text>} />,
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
    slug: "message-list", name: "MessageList", group: "Human+", scrollback: true,
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
    node: <ComposerDemo />, interactive: true,
  },
  {
    slug: "fancy-tui-provider", name: "FancyTuiProvider", group: "Human+",
    source: `<FancyTuiProvider>\n  <Header title="Deploy agent" status="connected" />\n  <Panel title="Run"><Text>Ready for instructions.</Text></Panel>\n</FancyTuiProvider>`,
    // A bare Fragment renders nothing through ink-testing-library — Ink needs a
    // layout node to measure against, so wrap the pair in a Stack.
    node: <Stack gap="sm"><Header title="Deploy agent" status="connected" /><Panel title="Run"><Text>Ready for instructions.</Text></Panel></Stack>,
  },
];

/** Every example keyed by slug — the lookup a docs host does per selection. */
export const SHOWCASE_EXAMPLES_BY_SLUG: ReadonlyMap<string, ShowcaseExample> = new Map(
  SHOWCASE_EXAMPLES.map((example) => [example.slug, example]),
);

/** The example for a slug, or `undefined` when the component has none. */
export function findShowcaseExample(slug: string): ShowcaseExample | undefined {
  return SHOWCASE_EXAMPLES_BY_SLUG.get(slug);
}
