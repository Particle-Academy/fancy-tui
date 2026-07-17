import { useMemo, type ReactNode } from "react";
import { Box, Text as InkText, useFocus, useInput } from "ink";
import { Row, Stack, Text } from "./layout.js";
import { useFancyTui } from "./theme.js";
import { useTuiSurface } from "./registry.js";
import { createTextBuffer, reduceTextBuffer, type CursorPosition, type SelectionRange, type TextBufferState } from "./keyboard/buffer.js";
import type { InteractiveProps, Option, TuiTone } from "./types.js";

export interface ButtonProps extends InteractiveProps { children?: ReactNode; onPress: () => void; tone?: TuiTone; loading?: boolean; }
export function Button({ id, children, onPress, tone = "primary", disabled = false, loading = false }: ButtonProps) {
  const { isFocused } = useFocus({ id, isActive: !disabled });
  useInput((input, key) => { if (isFocused && !disabled && (key.return || input === " ")) onPress(); });
  useTuiSurface(useMemo(() => ({ id, kind: "button", label: String(children ?? id), read: () => ({ disabled, loading }), commands: [{ name: "press", policy: "execute", invoke: onPress }] }), [id, children, disabled, loading, onPress]));
  return <InkText inverse={isFocused} dimColor={disabled} color={useFancyTui().theme.colors[tone]}>[ {loading ? "…" : children} ]</InkText>;
}

export function Field({ label, description, error, children }: { label: string; description?: string; error?: string; children?: ReactNode }) {
  return <Stack gap={0}><Text bold>{label}</Text>{children}{description ? <Text tone="muted">{description}</Text> : null}{error ? <Text tone="danger">{error}</Text> : null}</Stack>;
}
export function DisplayValue({ label, value }: { label?: string; value: ReactNode }) { return <Row>{label ? <Text tone="muted">{label}:</Text> : null}<Text>{value}</Text></Row>; }
export function Form({ children }: { children?: ReactNode }) { return <Stack>{children}</Stack>; }

export interface InputProps extends InteractiveProps { value: string; onChange: (value: string) => void; onSubmit?: (value: string) => void; placeholder?: string; mask?: string; }
export function Input({ id, value, onChange, onSubmit, placeholder, mask, disabled = false }: InputProps) {
  const { isFocused } = useFocus({ id, isActive: !disabled });
  useInput((input, key) => {
    if (!isFocused || disabled) return;
    if (key.return) { onSubmit?.(value); return; }
    if (key.backspace || key.delete) { onChange(value.slice(0, -1)); return; }
    if (!key.ctrl && !key.meta && input) onChange(value + input);
  });
  useTuiSurface(useMemo(() => ({ id, kind: "input", read: () => ({ value, disabled }), commands: [{ name: "set", invoke: (x) => onChange(String(x?.value ?? "")) }] }), [id, value, disabled, onChange]));
  const shown = value ? (mask ? mask.repeat(value.length) : value) : placeholder;
  return <Box borderStyle={isFocused ? "double" : "single"} paddingX={1}><InkText dimColor={!value}>{shown}{isFocused ? "▌" : ""}</InkText></Box>;
}

export interface MultilineInputProps extends InteractiveProps {
  value: string; onChange: (value: string) => void; onSubmit?: (value: string) => void;
  cursor?: CursorPosition; onCursorChange?: (cursor: CursorPosition) => void;
  selection?: SelectionRange; onSelectionChange?: (selection?: SelectionRange) => void;
  placeholder?: string; minRows?: number;
}
export function MultilineInput({ id, value, onChange, onSubmit, cursor = { offset: value.length }, onCursorChange, selection, onSelectionChange, placeholder, minRows = 3, disabled = false }: MultilineInputProps) {
  const { isFocused } = useFocus({ id, isActive: !disabled }); const { capabilities } = useFancyTui();
  const apply = (action: Parameters<typeof reduceTextBuffer>[1]) => {
    const next = reduceTextBuffer({ value, cursor, selection }, action); onChange(next.value); onCursorChange?.(next.cursor); onSelectionChange?.(next.selection);
  };
  useInput((input, key) => {
    if (!isFocused || disabled) return;
    if (key.return) {
      const newline = key.meta || (key.shift && capabilities.shiftEnter);
      if (newline) apply({ type: "insert", text: "\n" }); else onSubmit?.(value);
      return;
    }
    if (key.leftArrow) return apply({ type: "left" }); if (key.rightArrow) return apply({ type: "right" });
    if (key.upArrow) return apply({ type: "up" }); if (key.downArrow) return apply({ type: "down" });
    if (key.backspace) return apply({ type: "backspace" }); if (key.delete) return apply({ type: "delete" });
    if (!key.ctrl && !key.meta && input) apply({ type: "insert", text: input });
  });
  useTuiSurface(useMemo(() => ({ id, kind: "multiline-input", read: () => ({ value, cursor, selection }), commands: [{ name: "set", invoke: (x) => onChange(String(x?.value ?? "")) }, { name: "submit", policy: "execute", invoke: () => onSubmit?.(value) }] }), [id, value, cursor, selection, onChange, onSubmit]));
  const offset = Math.max(0, Math.min(value.length, cursor.offset)); const rendered = value ? `${value.slice(0, offset)}${isFocused ? "▌" : ""}${value.slice(offset)}` : placeholder ?? "";
  return <Box borderStyle={isFocused ? "double" : "single"} paddingX={1} minHeight={minRows}><InkText dimColor={!value}>{rendered}</InkText></Box>;
}
export const Textarea = MultilineInput;

function ChoiceList({ id, options, selected, onToggle, multiple = false, disabled = false, marker }: { id: string; options: Option[]; selected: string[]; onToggle: (id: string) => void; multiple?: boolean; disabled?: boolean; marker?: (on: boolean) => string }) {
  const { isFocused } = useFocus({ id, isActive: !disabled });
  useInput((input) => { if (!isFocused) return; const index = Number(input) - 1; const option = options[index]; if (option && !option.disabled) onToggle(option.id); });
  useTuiSurface(useMemo(() => ({ id, kind: multiple ? "choice-group" : "choice", read: () => ({ options, selected }), commands: [{ name: "select", invoke: (x) => onToggle(String(x?.id ?? "")) }] }), [id, options, selected, multiple, onToggle]));
  return <Stack gap={0}>{options.map((option, index) => { const on = selected.includes(option.id); return <Text key={option.id} tone={on ? "primary" : "text"} dimColor={option.disabled}>{index + 1}. {marker?.(on) ?? (on ? "●" : "○")} {option.label}</Text>; })}</Stack>;
}
export function Checkbox({ id, checked, onChange, label, disabled }: InteractiveProps & { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <ChoiceList id={id} options={[{ id, label }]} selected={checked ? [id] : []} onToggle={() => onChange(!checked)} multiple disabled={disabled} marker={(x) => x ? "[x]" : "[ ]"} />; }
export function CheckboxGroup({ id, value, onChange, options, disabled }: InteractiveProps & { value: string[]; onChange: (value: string[]) => void; options: Option[] }) { return <ChoiceList id={id} options={options} selected={value} onToggle={(x) => onChange(value.includes(x) ? value.filter((v) => v !== x) : [...value, x])} multiple disabled={disabled} marker={(x) => x ? "[x]" : "[ ]"} />; }
export function RadioGroup({ id, value, onChange, options, disabled }: InteractiveProps & { value?: string; onChange: (value: string) => void; options: Option[] }) { return <ChoiceList id={id} options={options} selected={value ? [value] : []} onToggle={onChange} disabled={disabled} />; }
export function Switch({ id, checked, onChange, label, disabled }: InteractiveProps & { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <Checkbox id={id} checked={checked} onChange={onChange} label={`${label} ${checked ? "ON" : "OFF"}`} disabled={disabled} />; }
export function MultiSwitch({ id, value, onChange, options, disabled }: InteractiveProps & { value: string; onChange: (value: string) => void; options: Option[] }) { return <RadioGroup id={id} value={value} onChange={onChange} options={options} disabled={disabled} />; }
export function Select(props: InteractiveProps & { value?: string; onChange: (value: string) => void; options: Option[] }) { return <RadioGroup {...props} />; }
export function Autocomplete({ query, onQueryChange, ...props }: InteractiveProps & { query: string; onQueryChange: (value: string) => void; value?: string; onChange: (value: string) => void; options: Option[] }) {
  const options = props.options.filter((x) => `${x.label} ${x.description ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <Stack><Input id={`${props.id}:query`} value={query} onChange={onQueryChange} placeholder="Search…" /><Select {...props} options={options} /></Stack>;
}
export function Pillbox({ id, value, onChange, inputValue, onInputChange }: InteractiveProps & { value: string[]; onChange: (value: string[]) => void; inputValue: string; onInputChange: (value: string) => void }) {
  const commit = () => { const item = inputValue.trim().replace(/,$/, ""); if (item) onChange([...value, item]); onInputChange(""); };
  return <Row>{value.map((item) => <BadgeLike key={item}>{item}</BadgeLike>)}<Input id={`${id}:add`} value={inputValue} onChange={(next) => { if (next.endsWith(",")) { const item = next.slice(0, -1).trim(); if (item) onChange([...value, item]); onInputChange(""); } else onInputChange(next); }} onSubmit={commit} placeholder="add tag" /></Row>;
}
function BadgeLike({ children }: { children: ReactNode }) { return <InkText color="cyan">[{children}]</InkText>; }
export function Slider({ id, value, onChange, min = 0, max = 100, step = 1, disabled }: InteractiveProps & { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  const { isFocused } = useFocus({ id, isActive: !disabled }); useInput((_i, key) => { if (!isFocused) return; if (key.leftArrow) onChange(Math.max(min, value - step)); if (key.rightArrow) onChange(Math.min(max, value + step)); });
  return <Text tone={isFocused ? "primary" : "text"}>{"─".repeat(Math.max(0, Math.round((value - min) / (max - min) * 10)))}●{"─".repeat(Math.max(0, 10 - Math.round((value - min) / (max - min) * 10)))} {value}</Text>;
}
