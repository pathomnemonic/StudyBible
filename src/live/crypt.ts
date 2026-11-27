/** Messages between a teacher and students go through public relays, so they are sealed with a key made from the class code together with a random room secret the host device creates. The code alone is never enough: it is written on the board for everyone to see, so anything made from the code alone can be recomputed by anyone. */
const enc = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();
const b64 = (u: Uint8Array) => { let s = ''; for (const b of u) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };

export function keyFor(key: string): Promise<CryptoKey> {
  if (!keys.has(key)) keys.set(key, (async () => {
    const base = await crypto.subtle.importKey('raw', enc.encode(key), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('studybible-live-v1'), iterations: 50_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  })());
  return keys.get(key)!;
}
/** where a room messages go: a name that gives away neither the code nor the secret it was made from */
export async function topicRoot(key: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${key}:studybible-live-v1`)));
  return `sbl1/${[...h].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
const SECRET_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** A fresh room secret: eight characters a student can read off a screen and type, chosen from letters and digits that cannot be confused with each other. */
export function newRoomSecret(): string {
  const a = crypto.getRandomValues(new Uint8Array(8));
  return [...a].map((x) => SECRET_ALPHABET[x % SECRET_ALPHABET.length]).join('');
}
/** The string a live room key and topic are made from: the visible code plus the room secret. */
export const roomKey = (code: string, secret: string) => `${code}.${secret}`;
/** Where one player messages go: a name made from a hash of the token, so the token itself never appears on the relay, where anyone watching could read it and answer as that player. */
export async function playerTopic(root: string, token: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`player:${token}`)));
  return `${root}/p/${[...h].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
export async function seal(key: string, data: unknown): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(key), enc.encode(JSON.stringify(data))));
  return enc.encode(b64(Uint8Array.from([...iv, ...ct])));
}
export async function open<T = unknown>(key: string, payload: Uint8Array): Promise<T | null> {
  try {
    const raw = unb64(new TextDecoder().decode(payload));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, await keyFor(key), raw.slice(12));
    return JSON.parse(new TextDecoder().decode(pt)) as T;
  } catch { return null; }
}
