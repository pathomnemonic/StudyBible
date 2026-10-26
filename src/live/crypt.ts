/** Messages between a teacher and students go through public relays, so they are sealed with a key made from the class code. */
const enc = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();
const b64 = (u: Uint8Array) => { let s = ''; for (const b of u) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };

export function keyFor(code: string): Promise<CryptoKey> {
  if (!keys.has(code)) keys.set(code, (async () => {
    const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('studybible-live-v1'), iterations: 50_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  })());
  return keys.get(code)!;
}
/** where a class's messages go: a name that does not give away the code */
export async function topicRoot(code: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${code}:studybible-live-v1`)));
  return `sbl1/${[...h].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
export async function seal(code: string, data: unknown): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(code), enc.encode(JSON.stringify(data))));
  return enc.encode(b64(Uint8Array.from([...iv, ...ct])));
}
export async function open<T = unknown>(code: string, payload: Uint8Array): Promise<T | null> {
  try {
    const raw = unb64(new TextDecoder().decode(payload));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, await keyFor(code), raw.slice(12));
    return JSON.parse(new TextDecoder().decode(pt)) as T;
  } catch { return null; }
}
