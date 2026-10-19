import { useSyncExternalStore } from 'react';
import { softBell, stopAmbience } from './ambience';

/** A quiet reading session: an optional timer, nothing else. No streaks, no counts, no notifications. */
export interface QuietState {
  /** 0 = no session; -1 = open-ended; otherwise the time it ends */
  endsAt: number;
  finished: boolean;
}
let state: QuietState = { endsAt: 0, finished: false };
const listeners = new Set<() => void>();
let timer: number | undefined;
const emit = (s: QuietState) => {
  state = s;
  listeners.forEach((l) => l());
};

export function startQuiet(minutes: number) {
  window.clearTimeout(timer);
  emit({ endsAt: minutes > 0 ? Date.now() + minutes * 60_000 : -1, finished: false });
  if (minutes > 0) {
    timer = window.setTimeout(() => {
      softBell();
      stopAmbience();
      emit({ endsAt: 0, finished: true });
      window.setTimeout(() => emit({ endsAt: 0, finished: false }), 9000);
    }, minutes * 60_000);
  }
}
export function endQuiet() {
  window.clearTimeout(timer);
  emit({ endsAt: 0, finished: false });
}
export const useQuiet = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
