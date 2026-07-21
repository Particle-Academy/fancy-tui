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

/**
 * `tuiNode()` for slots that are rendered bold.
 *
 * A plain string can be wrapped in `<Text bold>`; an ELEMENT cannot — putting a
 * Box inside a Text blanks the whole subtree exactly as a bare string in a Box
 * does (verified: the frame comes back empty, with nothing on stderr). So
 * elements pass through untouched and style themselves.
 */
export function tuiBoldNode(value: ReactNode): ReactNode {
  if (typeof value === "string" || typeof value === "number") return <InkText bold>{value}</InkText>;
  return tuiNode(value);
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

/**
 * `outlined` (default) — a quiet border, the everyday card.
 * `elevated` — a bold border in the card's tone; the terminal's only honest
 *   analogue of a shadow, since there is nothing to cast one onto.
 * `flat` — no border at all, for cards inside an already-bordered container.
 *
 * Mirrors `react-fancy`'s Card variants so the same word means the same weight
 * in both kits.
 */
export type CardVariant = "outlined" | "elevated" | "flat";
export type CardProps = PanelProps & { variant?: CardVariant };

function CardRoot({ variant = "outlined", title, tone = "neutral", focused = false, padding = "md", children, ...props }: CardProps) {
  const { theme } = useFancyTui();
  const borderStyle = variant === "flat" ? undefined : focused ? theme.borders.focus : variant === "elevated" ? "bold" : theme.borders.panel;
  const borderColor = focused ? theme.colors.focus : variant === "outlined" ? theme.colors.border : theme.colors[tone];
  return <InkBox
    borderStyle={borderStyle}
    borderColor={borderStyle ? borderColor : undefined}
    paddingX={typeof padding === "number" ? padding : theme.spacing[padding]}
    flexDirection="column"
    {...props}
  >
    {title ? <InkText color={theme.colors[tone]} bold>{title}</InkText> : null}
    {tuiNode(children)}
  </InkBox>;
}
// Bold the header without nesting a Box inside a Text — that combination made
// `<Card.Header><Badge/></Card.Header>` render an empty frame.
function CardHeader({ children }: { children?: ReactNode }) { return <InkBox marginBottom={1}>{tuiBoldNode(children)}</InkBox>; }
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
/**
 * The app shell.
 *
 * `fullHeight` claims every row of the terminal. Worth knowing before you skip
 * it: Ink sizes its output canvas from IN-FLOW layout, and an absolutely
 * positioned box that would draw past the bottom of that canvas is dropped
 * without a word — so a centered `Modal` or an edge-anchored `Drawer` renders
 * NOTHING in an app whose root is three lines tall. `<Screen fullHeight>` is
 * the one-line fix; `inline` on the overlay is the other.
 */
export function Screen({ children, fullHeight = false }: { children?: ReactNode; fullHeight?: boolean }) {
  const { height } = useTerminalSize();
  return <InkBox width="100%" height={fullHeight ? height : undefined} flexDirection="column">{tuiNode(children)}</InkBox>;
}
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

export interface HeroHint { keys: string | string[]; label?: string }
export interface HeroProps {
  title: string;
  tagline?: string;
  version?: string;
  /**
   * Optional brand mark, one entry per line.
   *
   * Passed as DATA rather than baked in, and never padded by hand: the box is
   * drawn by Ink from measured content, so a mark of any width stays aligned.
   * Hand-counted terminal art is the specific mistake this library's showcase
   * harness exists to prevent — four hand-written examples once shipped with
   * 79/78/77-column borders inside a single box.
   */
  mark?: string | string[];
  /** ASCII stand-in used when the terminal cannot render the unicode mark. */
  asciiMark?: string | string[];
  hints?: HeroHint[];
  tone?: TuiTone;
  align?: "left" | "center";
  /** Below this width the mark is dropped and the box loses its border. */
  compactBelow?: number;
}

/**
 * The startup screen for a terminal app — brand mark, title, tagline, version,
 * and how to get started.
 *
 * Every TUI wants one and none of them should be drawing it by hand. The
 * layout is flexbox all the way down, so nothing here assumes a column count:
 * on a narrow terminal the mark drops out and the border goes with it, rather
 * than wrapping into rubble.
 */
export function Hero({
  title,
  tagline,
  version,
  mark,
  asciiMark,
  hints,
  tone = "primary",
  align = "center",
  compactBelow = 48,
}: HeroProps) {
  const { theme, capabilities, width } = useFancyTui();
  const compact = width < compactBelow;

  // Fall back to the ASCII mark when the terminal cannot draw unicode, and
  // drop the mark entirely when there is no room for it.
  const chosen = capabilities.unicode ? mark : (asciiMark ?? mark);
  const lines = chosen === undefined ? [] : Array.isArray(chosen) ? chosen : chosen.split("\n");
  const showMark = !compact && lines.length > 0;
  const items = align === "center" ? "center" : "flex-start";

  const body = (
    <InkBox flexDirection="column" alignItems={items} width="100%">
      {showMark ? (
        <InkBox flexDirection="column" alignItems={items} marginBottom={1}>
          {lines.map((line, i) => (
            <InkText key={i} color={theme.colors[tone]} bold>{line}</InkText>
          ))}
        </InkBox>
      ) : null}

      <InkBox flexDirection="row" gap={1}>
        <InkText bold color={theme.colors[tone]}>{title}</InkText>
        {version ? <InkText color={theme.colors.muted}>{version}</InkText> : null}
      </InkBox>

      {tagline ? <InkText color={theme.colors.muted}>{tagline}</InkText> : null}

      {hints && hints.length > 0 ? (
        <InkBox flexDirection="row" gap={2} marginTop={1} flexWrap="wrap">
          {hints.map((hint, i) => (
            <KeyHint key={i} keys={hint.keys} label={hint.label} />
          ))}
        </InkBox>
      ) : null}
    </InkBox>
  );

  // No border when compact: a box drawn around content that is already at the
  // terminal's edge costs two columns it does not have.
  if (compact) return <InkBox flexDirection="column" width="100%">{body}</InkBox>;

  return (
    <InkBox
      borderStyle={theme.borders.panel}
      borderColor={theme.colors[tone]}
      paddingX={theme.spacing.lg}
      paddingY={theme.spacing.sm}
      flexDirection="column"
      width="100%"
    >
      {body}
    </InkBox>
  );
}
