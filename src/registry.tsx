import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { ActionPolicy } from "./types.js";

export interface TuiSurfaceCommand {
  name: string;
  description?: string;
  policy?: ActionPolicy;
  inputSchema?: Record<string, unknown>;
  invoke: (input?: Record<string, unknown>) => unknown | Promise<unknown>;
}
export interface TuiSurfaceDescriptor {
  id: string;
  kind: string;
  label?: string;
  read: () => unknown;
  commands?: TuiSurfaceCommand[];
}
export interface TuiSurfaceRegistry {
  register(surface: TuiSurfaceDescriptor): () => void;
  list(): TuiSurfaceDescriptor[];
  get(id: string): TuiSurfaceDescriptor | undefined;
  subscribe(listener: () => void): () => void;
}

export function createTuiSurfaceRegistry(): TuiSurfaceRegistry {
  const surfaces = new Map<string, TuiSurfaceDescriptor>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    register(surface) {
      if (surfaces.has(surface.id)) throw new Error(`Duplicate Fancy TUI surface id: ${surface.id}`);
      surfaces.set(surface.id, surface); notify();
      return () => { if (surfaces.get(surface.id) === surface) { surfaces.delete(surface.id); notify(); } };
    },
    list: () => [...surfaces.values()],
    get: (id) => surfaces.get(id),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

const RegistryContext = createContext<TuiSurfaceRegistry | null>(null);
export function TuiSurfaceProvider({ children, registry }: { children: ReactNode; registry?: TuiSurfaceRegistry }) {
  const owned = useMemo(() => registry ?? createTuiSurfaceRegistry(), [registry]);
  return <RegistryContext.Provider value={owned}>{children}</RegistryContext.Provider>;
}
export const useTuiSurfaceRegistry = () => useContext(RegistryContext);
export function useTuiSurface(surface: TuiSurfaceDescriptor) {
  const registry = useTuiSurfaceRegistry();
  useEffect(() => registry?.register(surface), [registry, surface]);
}
