export interface CursorPosition { offset: number; }
export interface SelectionRange { start: number; end: number; }
export interface TextBufferState { value: string; cursor: CursorPosition; selection?: SelectionRange; }
export type BufferAction =
  | { type: "insert"; text: string }
  | { type: "left" | "right" | "up" | "down" | "home" | "end" | "backspace" | "delete" }
  | { type: "set"; value: string; offset?: number };

const boundaries = (value: string) => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [0, ...Array.from(segmenter.segment(value), (x) => x.index + x.segment.length)];
};
const clamp = (n: number, value: string) => Math.max(0, Math.min(value.length, n));
const previousBoundary = (value: string, offset: number) => boundaries(value).filter((x) => x < offset).at(-1) ?? 0;
const nextBoundary = (value: string, offset: number) => boundaries(value).find((x) => x > offset) ?? value.length;

export function createTextBuffer(value = ""): TextBufferState { return { value, cursor: { offset: value.length } }; }

export function reduceTextBuffer(state: TextBufferState, action: BufferAction): TextBufferState {
  const offset = clamp(state.cursor.offset, state.value);
  if (action.type === "set") return { value: action.value, cursor: { offset: clamp(action.offset ?? action.value.length, action.value) } };
  if (action.type === "insert") {
    const start = state.selection ? Math.min(state.selection.start, state.selection.end) : offset;
    const end = state.selection ? Math.max(state.selection.start, state.selection.end) : offset;
    const value = state.value.slice(0, start) + action.text + state.value.slice(end);
    return { value, cursor: { offset: start + action.text.length } };
  }
  if (action.type === "left") return { ...state, selection: undefined, cursor: { offset: previousBoundary(state.value, offset) } };
  if (action.type === "right") return { ...state, selection: undefined, cursor: { offset: nextBoundary(state.value, offset) } };
  const lineStart = state.value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const lineEndFound = state.value.indexOf("\n", offset); const lineEnd = lineEndFound < 0 ? state.value.length : lineEndFound;
  if (action.type === "home") return { ...state, selection: undefined, cursor: { offset: lineStart } };
  if (action.type === "end") return { ...state, selection: undefined, cursor: { offset: lineEnd } };
  if (action.type === "up" || action.type === "down") {
    const column = offset - lineStart;
    if (action.type === "up" && lineStart > 0) {
      const previousEnd = lineStart - 1; const previousStart = state.value.lastIndexOf("\n", Math.max(0, previousEnd - 1)) + 1;
      return { ...state, selection: undefined, cursor: { offset: Math.min(previousStart + column, previousEnd) } };
    }
    if (action.type === "down" && lineEnd < state.value.length) {
      const nextStart = lineEnd + 1; const found = state.value.indexOf("\n", nextStart); const nextEnd = found < 0 ? state.value.length : found;
      return { ...state, selection: undefined, cursor: { offset: Math.min(nextStart + column, nextEnd) } };
    }
    return state;
  }
  if (state.selection && (action.type === "backspace" || action.type === "delete")) return reduceTextBuffer(state, { type: "insert", text: "" });
  if (action.type === "backspace" && offset > 0) {
    const start = previousBoundary(state.value, offset); return { value: state.value.slice(0, start) + state.value.slice(offset), cursor: { offset: start } };
  }
  if (action.type === "delete" && offset < state.value.length) {
    const end = nextBoundary(state.value, offset); return { value: state.value.slice(0, offset) + state.value.slice(end), cursor: { offset } };
  }
  return state;
}
