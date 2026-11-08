import { useEffect, useRef } from 'react';
import type { LiveView } from '../live/types';
import { saveSessionResults } from './results';

/** Mount once on the host screen: `useSaveResults(v)`. When the session ends, its per-question results are kept on this device for the teacher dashboard. */
export function useSaveResults(v: LiveView | null | undefined): void {
  const done = useRef('');
  useEffect(() => {
    if (!v || v.phase !== 'ended' || !v.results) return;
    const key = `${v.code}:${v.results.players.length}:${v.results.questions.length}`;
    if (done.current === key) return;
    done.current = key;
    void saveSessionResults(v.code, v);
  }, [v]);
}
