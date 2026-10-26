import { useEffect, useRef } from 'react';

export type Mode = 'tap' | 'pace' | 'voice' | 'audio';
export const SPEEDS = [{ label: 'Slow', wps: 2.4 }, { label: 'Steady', wps: 3.2 }, { label: 'Brisk', wps: 4.2 }];
export const voiceSupported = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

/**
 * Moves a prayer along by itself. "pace" waits long enough to say each step at a set speed; "voice" reads each step aloud with the
 * device's own speech voice and moves on when it finishes. Nothing runs in "tap" or "audio" mode (those are moved by the person or by a recording).
 */
export function useGuide({ mode, running, index, last, seconds, speech, speed, lang = 'en', onNext }: {
  mode: Mode; running: boolean; index: number; last: number; seconds: (i: number) => number; speech: (i: number) => string; speed: number; lang?: string; onNext: () => void;
}) {
  const next = useRef(onNext);
  next.current = onNext;
  useEffect(() => {
    if (!running || index >= last) return;
    if (mode === 'pace') {
      const t = window.setTimeout(() => next.current(), (seconds(index) * 1000 * 3.2) / SPEEDS[speed].wps);
      return () => window.clearTimeout(t);
    }
    if (mode === 'voice' && voiceSupported()) {
      let dead = false;
      let t = 0;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(speech(index));
      u.lang = lang;
      u.rate = [0.8, 0.92, 1.05][speed];
      u.onend = () => { if (!dead) t = window.setTimeout(() => next.current(), 700); };
      u.onerror = () => { if (!dead) t = window.setTimeout(() => next.current(), 1500); };
      speechSynthesis.speak(u);
      return () => { dead = true; window.clearTimeout(t); speechSynthesis.cancel(); };
    }
  }, [mode, running, index, last, speed]);
  useEffect(() => () => { if (voiceSupported()) speechSynthesis.cancel(); }, []);
}
