/**
 * Sign in with Apple through the iOS sheet (the @capacitor-community/apple-sign-in plugin), used inside the iOS app instead of the web redirect.
 * The plugin is reached by name through the Capacitor bridge, the same way the widget bridge reaches its plugin, so the web build needs no plugin import.
 * The server checks the identity token and swaps the one time code for a refresh token it can hand back when the account is deleted.
 */
export const APPLE_BUNDLE_ID = 'com.pathomnemonic.cathology';

interface ApplePlugin {
  authorize(o: { clientId: string; redirectURI: string; scopes: string; nonce: string }): Promise<{ response: { identityToken: string; authorizationCode: string } }>;
}
const cap = () => (window as unknown as { Capacitor?: { getPlatform?: () => string; Plugins?: Record<string, unknown> } }).Capacitor;

/** True only inside the iOS app, where the native sheet exists. Everywhere else the web flow is used. */
export function appleNativeAvailable(): boolean {
  const c = cap();
  return !!c && c.getPlatform?.() === 'ios' && !!c.Plugins?.SignInWithApple;
}

const sha256Hex = async (text: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export interface AppleNativeResult { identityToken: string; nonce: string; code: string }

/** Opens the Apple sheet. Apple is sent the SHA 256 hash of the nonce; the server is given the raw nonce and checks the token against it, matching the Dx Dash pattern. */
export async function signInWithAppleNative(): Promise<AppleNativeResult> {
  const plugin = cap()?.Plugins?.SignInWithApple as ApplePlugin | undefined;
  if (!plugin) throw new Error('Apple sign in is not available here.');
  const rawNonce = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashed = await sha256Hex(rawNonce);
  const { response } = await plugin.authorize({ clientId: APPLE_BUNDLE_ID, redirectURI: '', scopes: 'email name', nonce: hashed });
  return { identityToken: response.identityToken, nonce: rawNonce, code: response.authorizationCode };
}

/** True when the sheet was closed without signing in, so the caller can stay quiet about it. */
export const isAppleCancel = (e: unknown): boolean => /1001|cancel/i.test(String((e as { message?: string })?.message ?? e ?? ''));
