import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadEditions, type EditionRecord } from './loader';
import type { PlannedEdition } from '../lib/types';

interface Ctx {
  ready: boolean;
  error?: string;
  editions: EditionRecord[];
  planned: PlannedEdition[];
  get: (id: string) => EditionRecord | undefined;
}

const C = createContext<Ctx>({ ready: false, editions: [], planned: [], get: () => undefined });

export function EditionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ ready: false, editions: [], planned: [], get: () => undefined });
  useEffect(() => {
    loadEditions()
      .then((f) =>
        setState({ ready: true, editions: f.editions, planned: f.planned, get: (id) => f.editions.find((e) => e.id === id) }),
      )
      .catch((e) => setState((s) => ({ ...s, ready: true, error: String(e.message ?? e) })));
  }, []);
  return <C.Provider value={state}>{children}</C.Provider>;
}

export const useEditions = () => useContext(C);
