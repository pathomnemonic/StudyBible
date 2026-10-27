import { useState } from 'react';

/** A yes/no choice remembered on this device. */
export function useLocalFlag(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(() => { try { const v = localStorage.getItem(key); return v === null ? initial : v === '1'; } catch { return initial; } });
  return [on, (v) => { setOn(v); try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* private mode */ } }];
}
