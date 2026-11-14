import type { Embed } from './embed';

/**
 * One playing video or audio at a time, kept alive across page changes.
 *
 * A page that wants to play something renders an <InlinePlayer>, which only reserves a box (the "anchor") and tells this
 * store what to play. The real iframe / audio / video element lives in <MediaHost> at the root of the app, so moving to
 * another tab does not destroy it: the host simply shrinks to a small player docked above the tab bar.
 */
export interface HostItem { key: string; embed: Embed; title: string; route: string }
export interface HostState { item: HostItem | null; anchor: HTMLElement | null }

let state: HostState = { item: null, anchor: null };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getState = () => state;

const here = () => { try { return location.hash.replace(/^#/, '') || '/'; } catch { return '/'; } };

/** A page shows (or re-shows) this media in the given box. The same media keeps playing; different media replaces it. */
export function claim(key: string, embed: Embed, title: string, anchor: HTMLElement) {
  const same = state.item?.key === key;
  state = { item: same ? { ...state.item!, title } : { key, embed, title, route: here() }, anchor };
  emit();
}

/**
 * The page's box went away. If the reader has moved to another page the media carries on in the dock; if the page itself
 * closed the player (same page still showing) the media stops.
 */
export function release(key: string, anchor: HTMLElement | null) {
  if (state.item?.key !== key || (anchor && state.anchor !== anchor)) return;
  if (here() === state.item.route) state = { item: null, anchor: null };
  else state = { ...state, anchor: null };
  emit();
}

export function closeHost() { if (state.item) { state = { item: null, anchor: null }; emit(); } }
