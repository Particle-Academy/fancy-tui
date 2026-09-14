import { EventEmitter } from "node:events";
import type { ReactElement } from "react";
import { render as inkRender, type Instance } from "ink";

/**
 * Render an Ink tree into memory — the test and showcase-capture harness.
 *
 * It replaces `ink-testing-library`, whose upstream has had no commit since
 * 2024 and so fails the kit's third-party freshness bar. The API is the subset
 * this package's suites use, with the same behaviour: a 100-column stdout that
 * records every frame, a stdin that delivers keystrokes the way Ink 7 reads
 * them, and a `cleanup()` that unmounts everything rendered so far.
 *
 * Internal. Not exported from any entry point.
 */

/** The width Ink lays out to. ink-testing-library's value, kept so frames do not move. */
export const HARNESS_COLUMNS = 100;

class FrameStream extends EventEmitter {
  readonly frames: string[] = [];
  private last: string | undefined;

  write = (frame: string): boolean => {
    this.frames.push(frame);
    this.last = frame;
    return true;
  };

  lastFrame = (): string | undefined => this.last;
}

class HarnessStdout extends FrameStream {
  get columns(): number {
    return HARNESS_COLUMNS;
  }
}

/**
 * A stdin that claims to be a raw-mode TTY and delivers written data.
 *
 * Ink 7 reads input with the readable-then-`read()` pattern, so a write must
 * both hold the data for `read()` and emit `readable` — emitting `data` alone
 * delivers nothing to `useInput`. `data` is emitted as well for listeners that
 * use it.
 */
class HarnessStdin extends EventEmitter {
  isTTY = true;
  private data: string | null = null;

  write = (data: string): void => {
    this.data = data;
    this.emit("readable");
    this.emit("data", data);
  };

  read = (): string | null => {
    const { data } = this;
    this.data = null;
    return data;
  };

  setEncoding(): void {}
  setRawMode(): void {}
  resume(): void {}
  pause(): void {}
  ref(): void {}
  unref(): void {}
}

export interface HarnessView {
  rerender: (tree: ReactElement) => void;
  unmount: () => void;
  cleanup: () => void;
  stdout: HarnessStdout;
  stderr: FrameStream;
  stdin: HarnessStdin;
  /** Every frame written so far, oldest first. */
  frames: string[];
  lastFrame: () => string | undefined;
}

const mounted = new Set<Instance>();

export function render(tree: ReactElement): HarnessView {
  const stdout = new HarnessStdout();
  const stderr = new FrameStream();
  const stdin = new HarnessStdin();
  const instance = inkRender(tree, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stderr: stderr as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    // Debug mode writes the whole frame on every render instead of diffing
    // against the terminal, so `lastFrame()` is always a complete picture.
    debug: true,
    exitOnCtrlC: false,
    patchConsole: false,
  });
  mounted.add(instance);
  return {
    rerender: instance.rerender,
    unmount: instance.unmount,
    cleanup: instance.cleanup,
    stdout,
    stderr,
    stdin,
    frames: stdout.frames,
    lastFrame: stdout.lastFrame,
  };
}

/** Unmount and clean up every tree rendered since the last `cleanup()`. */
export function cleanup(): void {
  for (const instance of mounted) {
    instance.unmount();
    instance.cleanup();
  }
  mounted.clear();
}
