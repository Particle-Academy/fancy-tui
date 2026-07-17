import { type ReactNode } from "react";
import { Box, Static, Text as InkText } from "ink";
import { Badge, ActivityIndicator } from "./display.js";
import { Row, Stack, Text } from "./layout.js";
import { renderMarkdown } from "./markdown/render.js";
import type { TuiTone } from "./types.js";

export function Markdown({ children }: { children: string }) { return <InkText>{renderMarkdown(children)}</InkText>; }
export function CodeView({ code, language, lineNumbers = false }: { code: string; language?: string; lineNumbers?: boolean }) {
  const source = lineNumbers ? code.split("\n").map((line, index) => `${String(index + 1).padStart(3)} │ ${line}`).join("\n") : code;
  return <Box borderStyle="single" paddingX={1}><Markdown>{`\`\`\`${language ?? "text"}\n${source}\n\`\`\``}</Markdown></Box>;
}

export interface StaticListProps<T> { items: readonly T[]; getKey: (item: T) => string; renderItem: (item: T) => ReactNode; }
export function StaticList<T>({ items, getKey, renderItem }: StaticListProps<T>) {
  return <Static items={[...items]}>{(item) => <Box key={getKey(item)}>{renderItem(item)}</Box>}</Static>;
}
export const LogList = StaticList;
export function LiveRegion({ children }: { children?: ReactNode }) { return <Box flexDirection="column">{children}</Box>; }

export type MessageRole = "user" | "agent" | "tool" | "error" | "system";
export interface MessageData { id: string; role: MessageRole; content: string; name?: string; timestamp?: string; }
const roleTone: Record<MessageRole, TuiTone> = { user: "user", agent: "agent", tool: "tool", error: "danger", system: "neutral" };
export function Message({ message }: { message: MessageData }) {
  return <Stack gap={0}><Row><Badge tone={roleTone[message.role]}>{message.name ?? message.role}</Badge>{message.timestamp ? <Text tone="muted">{message.timestamp}</Text> : null}</Row><Markdown>{message.content}</Markdown></Stack>;
}
export function MessageList({ messages }: { messages: readonly MessageData[] }) { return <StaticList items={messages} getKey={(x) => x.id} renderItem={(x) => <Message message={x} />} />; }
export interface ToolCallData { id: string; name: string; status: "pending" | "success" | "failure"; detail?: string; }
export function ToolCall({ call }: { call: ToolCallData }) { return <Row><ActivityIndicator status={call.status} /><Text tone="tool">{call.name}</Text>{call.detail ? <Text tone="muted">{call.detail}</Text> : null}</Row>; }
export function Composer({ id, value, onChange, onSubmit, placeholder = "Message…" }: { id: string; value: string; onChange: (value: string) => void; onSubmit: (value: string) => void; placeholder?: string }) {
  // Late import avoided: Composer is a semantic alias around the public multiline input.
  const InputComponent = requireMultiline(); return <InputComponent id={id} value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} />;
}
function requireMultiline() { return MultilineProxy; }
import { MultilineInput as MultilineProxy } from "./inputs.js";
export const PromptInput = Composer;
