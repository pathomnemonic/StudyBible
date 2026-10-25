/**
 * Optional password protection for a backup file (not for sync). PBKDF2-SHA-256 (310,000 rounds) derives an AES-256-GCM key;
 * the file records the salt, iv and rounds. There is no recovery: lose the password and the file cannot be opened.
 */
const ITER = 310_000;
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function key(password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptBackup(text: string, password: string): Promise<string> {
  if (password.length < 8) throw new Error('Choose a password of at least 8 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(password, salt, ITER), new TextEncoder().encode(text)));
  // the data is stored in chunks so a large backup does not overflow the call stack when turned into base64
  let bin = '';
  for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode(...data.subarray(i, i + 0x8000));
  return JSON.stringify({ format: 'studybible-encrypted', version: 1, kdf: 'PBKDF2-SHA256', iterations: ITER, salt: b64(salt), iv: b64(iv), data: btoa(bin) });
}

export const isEncryptedBackup = (text: string) => { try { return JSON.parse(text)?.format === 'studybible-encrypted'; } catch { return false; } };

export async function decryptBackup(text: string, password: string): Promise<string> {
  const f = JSON.parse(text);
  if (f.format !== 'studybible-encrypted' || f.version !== 1) throw new Error('This is not a protected Study Bible backup.');
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(f.iv) as BufferSource }, await key(password, unb64(f.salt), f.iterations), unb64(f.data) as BufferSource);
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('That password does not open this backup, or the file is damaged.');
  }
}
