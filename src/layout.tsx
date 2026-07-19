import { Children, type ReactNode } from "react";
import { Box as InkBox, Text as InkText, type BoxProps as InkBoxProps, type TextProps as InkTextProps } from "ink";
import { useFancyTui, useTerminalSize } from "./theme.js";
import type { TuiSize, TuiTone } from "./types.js";

export type BoxProps = InkBoxProps;
export const Box = InkBox;

/**
 * Wrap bare strings/numbers in `<Text>` before they reach an Ink `Box`.
 *
 * Ink requires text to live inside a `<Text>`; a raw string placed directly in
 * a Box does not just render unstyled — it makes the WHOLE subtree render as
 * empty output, with nothing written to stderr. So `<Header status="ok" />`,
 * the most natural way to call these components, silently produced a blank
 * frame while `status={<Text>ok</Text>}` worked.
 *
 * Every component taking a `ReactNode` slot and placing it in a Box routes it
 * through here, so a plain string is always accepted.
 */
export function tuiNode(value: ReactNode): ReactNode {
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "string" || typeof value === "number") return <InkText>{value}</InkText>;
  if (Array.isArray(value)) {
    return Children.map(value as ReactNode[], (child) => tuiNode(child));
  }
  return value;
}

export type StackProps = Omit<InkBoxProps, "gap" | "children"> & { gap?: TuiSize | number; children?: ReactNode };
export function Stack({ gap = "md", children, ...props }: StackProps) {
  const { theme } = useFancyTui();
  return <InkBox flexDirection="column" gap={typeof gap === "number" ? gap : theme.spacing[gap]} {...props}>{tuiNode(children)}</InkBox>;
}
export function Row({ gap = "md", children, ...props }: StackProps) {
  const { theme } = useFancyTui();
  return <InkBox flexDirection="row" gap={typeof gap === "number" ? gap : theme.spacing[gap]} {...props}>{tuiNode(children)}</InkBox>;
}
export function Column(props: StackProps) { return <Stack {...props} />; }
export function Spacer() { return <InkBox flexGrow={1} />; }

export interface SeparatorProps { orientation?: "horizontal" | "vertical"; label?: string; tone?: TuiTone; }
export function Separator({ orientation = "horizontal", label, tone = "neutral" }: SeparatorProps) {
  const { theme, width } = useFancyTui();
  const color = theme.colors[tone];
  if (orientation === "vertical") return <InkText color={color}>│</InkText>;
  const rule = "─".repeat(Math.max(1, width - (label?.length ?? 0) - (label ? 2 : 0)));
  return <InkText color={color}>{label ? `${label} ${rule}` : rule}</InkText>;
}

export type PanelProps = Omit<InkBoxProps, "padding" | "children"> & { title?: string; tone?: TuiTone; focused?: boolean; padding?: TuiSize | number; children?: ReactNode };
export function Panel({ title, tone = "neutral", focused = false, padding = "md", children, ...props }: PanelProps) {
  const { theme } = useFancyTui();
  return <InkBox
    borderStyle={focused ? theme.borders.focus : theme.borders.panel}
    borderColor={focused ? theme.colors.focus : theme.colors[tone]}
    paddingX={typeof padding === "number" ? padding : theme.spacing[padding]}
    flexDirection="column"
    {...props}
  >
    {title ? <InkText color={theme.colors[tone]} bold>{title}</InkText> : null}
    {tuiNode(children)}
  </InkBox>;
}

function CardRoot(props: PanelProps) { return <Panel {...props} />; }
function CardHeader({ children }: { children?: ReactNode }) { return <InkBox marginBottom={1}><InkText bold>{children}</InkText></InkBox>; }
function CardBody({ children }: { children?: ReactNode }) { return <InkBox flexDirection="column">{tuiNode(children)}</InkBox>; }
function CardFooter({ children }: { children?: ReactNode }) { return <InkBox marginTop={1}>{tuiNode(children)}</InkBox>; }
export const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody, Footer: CardFooter });

export interface HeaderProps { title: string; subtitle?: string; status?: ReactNode; }
export function Header({ title, subtitle, status }: HeaderProps) {
  const { theme } = useFancyTui();
  return <Row><InkText bold color={theme.colors.primary}>{title}</InkText>{subtitle ? <InkText dimColor>{subtitle}</InkText> : null}<Spacer />{tuiNode(status)}</Row>;
}
export interface StatusBarProps { left?: ReactNode; center?: ReactNode; right?: ReactNode; }
export function StatusBar({ left, center, right }: StatusBarProps) {
  const { theme } = useFancyTui();
  return <InkBox borderStyle="single" borderColor={theme.colors.border} paddingX={1}><InkBox>{tuiNode(left)}</InkBox><Spacer /><InkBox>{tuiNode(center)}</InkBox><Spacer /><InkBox>{tuiNode(right)}</InkBox></InkBox>;
}
export function Screen({ children }: { children?: ReactNode }) { return <InkBox width="100%" flexDirection="column">{tuiNode(children)}</InkBox>; }
export function Responsive({ below, children, fallback = null }: { below: number; children?: ReactNode; fallback?: ReactNode }) {
  const { width } = useTerminalSize(); return <>{width < below ? fallback : children}</>;
}

export interface TextProps extends InkTextProps { tone?: TuiTone | "text" | "muted"; }
export function Text({ tone = "text", children, ...props }: TextProps) {
  const { theme } = useFancyTui(); return <InkText color={theme.colors[tone]} {...props}>{children}</InkText>;
}
export interface HeadingProps extends TextProps { level?: 1 | 2 | 3 | 4 | 5 | 6; }
export function Heading({ level = 2, children, ...props }: HeadingProps) {
  const prefix = level === 1 ? "█ " : level === 2 ? "▌ " : "";
  return <Text bold {...props}>{prefix}{children}</Text>;
}
export function KeyHint({ keys, label }: { keys: string | string[]; label?: string }) {
  const value = Array.isArray(keys) ? keys.join("+") : keys;
  return <Row gap={0}><Text tone="muted">[</Text><Text tone="primary" bold>{value}</Text><Text tone="muted">]{label ? ` ${label}` : ""}</Text></Row>;
}
export function Sidebar({ items, activeId, onChange }: { items: Array<{ id: string; label: string }>; activeId?: string; onChange?: (id: string) => void }) {
  return <Stack gap={0}>{items.map((item) => <Text key={item.id} tone={item.id === activeId ? "primary" : "text"}>{item.id === activeId ? "› " : "  "}{item.label}</Text>)}</Stack>;
}
