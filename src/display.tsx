import { useEffect, useState, type ReactNode } from "react";
import { Box, Text as InkText } from "ink";
import { Row, Stack, Text } from "./layout.js";
import { useFancyTui } from "./theme.js";
import type { TuiTone } from "./types.js";

export function Badge({ children, tone = "neutral" }: { children?: ReactNode; tone?: TuiTone }) {
  const { theme } = useFancyTui(); return <InkText backgroundColor={theme.colors[tone]} color="black"> {children} </InkText>;
}
export function Callout({ title, children, tone = "info" }: { title?: string; children?: ReactNode; tone?: TuiTone }) {
  return <Box borderStyle="single" borderColor={useFancyTui().theme.colors[tone]} paddingX={1}><Stack gap={0}>{title ? <Text tone={tone} bold>{title}</Text> : null}<Text>{children}</Text></Stack></Box>;
}
const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export function Spinner({ label, interval = 80 }: { label?: string; interval?: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => { const timer = setInterval(() => setFrame((x) => (x + 1) % frames.length), interval); return () => clearInterval(timer); }, [interval]);
  return <Text tone="primary">{frames[frame]}{label ? ` ${label}` : ""}</Text>;
}
export function Progress({ value, max = 100, width = 20, label }: { value: number; max?: number; width?: number; label?: string }) {
  const ratio = Math.max(0, Math.min(1, max ? value / max : 0)); const filled = Math.round(width * ratio);
  return <Row gap={1}><Text tone="primary">{"█".repeat(filled)}<InkText dimColor>{"░".repeat(width - filled)}</InkText></Text>{label ? <Text>{label}</Text> : null}<Text tone="muted">{Math.round(ratio * 100)}%</Text></Row>;
}
export function Skeleton({ width = 12 }: { width?: number }) { return <InkText dimColor>{"░".repeat(width)}</InkText>; }
export function Avatar({ name, glyph }: { name: string; glyph?: string }) { return <Badge tone="primary">{glyph ?? name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase()}</Badge>; }
export function Profile({ name, subtitle, glyph }: { name: string; subtitle?: string; glyph?: string }) { return <Row><Avatar name={name} glyph={glyph} /><Stack gap={0}><Text bold>{name}</Text>{subtitle ? <Text tone="muted">{subtitle}</Text> : null}</Stack></Row>; }
export function ActivityIndicator({ status, label }: { status: "idle" | "pending" | "success" | "failure"; label?: string }) {
  const { theme } = useFancyTui();
  if (status === "pending") return <Spinner label={label} />;
  const tone = status === "success" ? "success" : status === "failure" ? "danger" : "muted";
  const glyph = status === "success" ? theme.glyphs.success : status === "failure" ? theme.glyphs.failure : "○";
  return <Text tone={tone}>{glyph}{label ? ` ${label}` : ""}</Text>;
}
export function Timeline({ items }: { items: Array<{ id: string; title: string; detail?: string; tone?: TuiTone }> }) {
  return <Stack gap={0}>{items.map((item, index) => <Row key={item.id} alignItems="flex-start"><Text tone={item.tone ?? "primary"}>{index === items.length - 1 ? "└─" : "├─"}</Text><Stack gap={0}><Text bold>{item.title}</Text>{item.detail ? <Text tone="muted">{item.detail}</Text> : null}</Stack></Row>)}</Stack>;
}
