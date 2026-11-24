import { createHash, createPrivateKey, createPublicKey, createVerify, randomBytes, sign as nodeSign, type JsonWebKey } from 'node:crypto';

/**
 * Sign in with another service ("Continue with Google" and the like), using OpenID Connect: the authorization-code flow with PKCE, a one-time state, a nonce,
 * and the ID token checked here (signature against the provider's published keys, issuer, audience, expiry, nonce). No third-party library and no external database:
 * the short-lived login attempts live in the same SQLite file as everything else.
 *
 * It is OFF unless the operator sets OAUTH=on and at least one provider's credentials (see docs/SIGN_IN_PROVIDERS.md). Nothing here runs otherwise.
 */

export interface Provider {
  id: string;
  /** shown on the button */
  name: string;
  /** the issuers an ID token may carry (a function for providers whose issuer varies, such as Microsoft's tenants) */
  issuerOk: (iss: string, claims: Claims) => boolean;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  clientId: string;
  /** a fixed secret, or a function that makes a fresh one (Apple's is a signed token) */
  clientSecret: () => string;
  scopes: string[];
  /** extra parameters on the authorization request */
  authParams?: Record<string, string>;
  /** the provider promises the email on the ID token belongs to the person (Google says so with `email_verified`) */
  trustsEmailClaim: (claims: Claims) => boolean;
  /** Apple sends the callback as a cross-site form post */
  formPost?: boolean;
}

export type Claims = Record<string, unknown>;

export interface OAuthConfig {
  enabled: boolean;
  /** where the app is reached from outside, for example https://study.example.org (the sign-in return address is built from it) */
  publicUrl: string;
  providers: Provider[];
  /** the Apple provider shaped for the native iOS sheet: its client id is the app's bundle id, not the web Services ID. Present only when the Apple key material is set. */
  appleNative?: Provider | null;
  /** only for tests: lets a provider on http://127.0.0.1 be used */
  allowInsecure?: boolean;
  fetchImpl?: typeof fetch;
}

export const OFF: OAuthConfig = { enabled: false, publicUrl: '', providers: [] };

/* ------------------------------------------------------------------ small helpers */

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');
export const randomUrlToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const pkceChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
export const hashState = (state: string) => createHash('sha256').update(state).digest('hex');
export const redirectUri = (cfg: OAuthConfig, id: string) => `${cfg.publicUrl.replace(/\/$/, '')}/api/auth/oauth/${id}/callback`;

/* ------------------------------------------------------------------ providers from the environment */

const GOOGLE_ISS = new Set(['https://accounts.google.com', 'accounts.google.com']);

/** The bundle id the native Apple sheet answers to, unless the operator overrides it. */
export const APPLE_BUNDLE_ID_DEFAULT = 'com.pathomnemonic.cathology';

/** Builds the list of providers the operator has fully configured, plus any mistakes found (reported at start-up, never silently ignored). */
export function providersFromEnv(env: Record<string, string | undefined>): { providers: Provider[]; errors: string[]; appleNative: Provider | null } {
  const providers: Provider[] = [];
  const errors: string[] = [];
  let appleNative: Provider | null = null;
  const need = (label: string, names: string[]) => {
    const have = names.filter((n) => env[n]);
    if (have.length && have.length < names.length) { errors.push(`${label}: set all of ${names.join(', ')} (missing ${names.filter((n) => !env[n]).join(', ')}).`); return false; }
    return have.length === names.length;
  };

  if (need('Google sign-in', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])) {
    providers.push({
      id: 'google', name: 'Google',
      issuerOk: (iss) => GOOGLE_ISS.has(iss),
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
      clientId: env.GOOGLE_CLIENT_ID!, clientSecret: () => env.GOOGLE_CLIENT_SECRET!,
      scopes: ['openid', 'email', 'profile'],
      trustsEmailClaim: (c) => c.email_verified === true || c.email_verified === 'true',
    });
  }

  if (need('Microsoft sign-in', ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'])) {
    const tenant = env.MICROSOFT_TENANT || 'common';
    providers.push({
      id: 'microsoft', name: 'Microsoft',
      // with the "common" tenant the issuer carries the person's own tenant id; it must still be Microsoft's v2 issuer for that tenant
      issuerOk: (iss, c) => iss === `https://login.microsoftonline.com/${typeof c.tid === 'string' ? c.tid : ''}/v2.0` && (tenant === 'common' || tenant === 'organizations' || tenant === 'consumers' || c.tid === tenant),
      authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      jwksUri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
      clientId: env.MICROSOFT_CLIENT_ID!, clientSecret: () => env.MICROSOFT_CLIENT_SECRET!,
      scopes: ['openid', 'email', 'profile'],
      // Microsoft does not say whether the email was verified, and an organisation can set any address on its own users: never trust it
      trustsEmailClaim: () => false,
    });
  }

  if (need('Apple sign-in', ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'])) {
    const pem = env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    try { createPrivateKey(pem); } catch { errors.push('Apple sign-in: APPLE_PRIVATE_KEY is not a valid private key (paste the whole .p8 file; \\n is accepted for new lines).'); }
    providers.push({
      id: 'apple', name: 'Apple',
      issuerOk: (iss) => iss === 'https://appleid.apple.com',
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      jwksUri: 'https://appleid.apple.com/auth/keys',
      clientId: env.APPLE_CLIENT_ID!,
      clientSecret: () => appleClientSecret({ teamId: env.APPLE_TEAM_ID!, keyId: env.APPLE_KEY_ID!, clientId: env.APPLE_CLIENT_ID!, privateKeyPem: pem }),
      scopes: ['openid', 'email', 'name'],
      authParams: { response_mode: 'form_post' }, formPost: true,
      trustsEmailClaim: (c) => c.email_verified === true || c.email_verified === 'true',
    });
  }
  // the native iOS sheet needs only the key material: its client id is the bundle id, so it works before any web Services ID exists
  if (env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
    const pem = env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    let keyOk = true;
    try { createPrivateKey(pem); } catch { keyOk = false; if (!env.APPLE_CLIENT_ID) errors.push('Apple sign-in: APPLE_PRIVATE_KEY is not a valid private key (paste the whole .p8 file; \\n is accepted for new lines).'); }
    if (keyOk) {
      const bundleId = env.APPLE_BUNDLE_ID || APPLE_BUNDLE_ID_DEFAULT;
      appleNative = {
        id: 'apple', name: 'Apple',
        issuerOk: (iss) => iss === 'https://appleid.apple.com',
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
        tokenEndpoint: 'https://appleid.apple.com/auth/token',
        jwksUri: 'https://appleid.apple.com/auth/keys',
        clientId: bundleId,
        clientSecret: () => appleClientSecret({ teamId: env.APPLE_TEAM_ID!, keyId: env.APPLE_KEY_ID!, clientId: bundleId, privateKeyPem: pem }),
        scopes: ['openid', 'email', 'name'],
        trustsEmailClaim: (c) => c.email_verified === true || c.email_verified === 'true',
      };
    }
  }
  return { providers, errors, appleNative };
}

/** Apple wants the client secret to be a short-lived token signed with the developer's private key (ES256). */
export function appleClientSecret(o: { teamId: string; keyId: string; clientId: string; privateKeyPem: string; now?: number }): string {
  const iat = Math.floor((o.now ?? Date.now()) / 1000);
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: o.keyId, typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: o.teamId, iat, exp: iat + 600, aud: 'https://appleid.apple.com', sub: o.clientId }));
  const sig = nodeSign('sha256', Buffer.from(`${head}.${body}`), { key: o.privateKeyPem, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64u(sig)}`;
}

/* ------------------------------------------------------------------ the authorization request */

export function authorizationUrl(cfg: OAuthConfig, p: Provider, o: { state: string; nonce: string; verifier: string }): string {
  const u = new URL(p.authorizationEndpoint);
  const params: Record<string, string> = {
    response_type: 'code', client_id: p.clientId, redirect_uri: redirectUri(cfg, p.id), scope: p.scopes.join(' '),
    state: o.state, nonce: o.nonce, code_challenge: pkceChallenge(o.verifier), code_challenge_method: 'S256', ...(p.authParams ?? {}),
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

/* ------------------------------------------------------------------ the token exchange */

export class OAuthError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

const secureOrLocal = (cfg: OAuthConfig, url: string) => url.startsWith('https://') || (cfg.allowInsecure === true && /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url));

export async function exchangeCode(cfg: OAuthConfig, p: Provider, code: string, verifier: string): Promise<{ idToken: string; refreshToken?: string }> {
  if (!secureOrLocal(cfg, p.tokenEndpoint)) throw new OAuthError('provider_misconfigured', 'The provider’s token address must be https.');
  const f = cfg.fetchImpl ?? fetch;
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(cfg, p.id), client_id: p.clientId, client_secret: p.clientSecret(), code_verifier: verifier });
  let res: Response;
  try { res = await f(p.tokenEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body, signal: AbortSignal.timeout(10_000) }); }
  catch { throw new OAuthError('provider_unreachable', 'Could not reach the sign-in provider.'); }
  const data = (await res.json().catch(() => ({}))) as { id_token?: unknown; refresh_token?: unknown };
  if (!res.ok || typeof data.id_token !== 'string') throw new OAuthError('exchange_failed', 'The sign-in provider did not accept the sign-in.');
  return { idToken: data.id_token, refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined };
}

/* ------------------------------------------------------------------ checking the ID token */

interface Jwks { keys: (JsonWebKey & { kid?: string; alg?: string })[] }
const jwksCache = new Map<string, { at: number; jwks: Jwks }>();
const JWKS_TTL = 3600_000;

async function keysFor(cfg: OAuthConfig, p: Provider, force: boolean): Promise<Jwks> {
  const hit = jwksCache.get(p.jwksUri);
  if (hit && !force && Date.now() - hit.at < JWKS_TTL) return hit.jwks;
  if (!secureOrLocal(cfg, p.jwksUri)) throw new OAuthError('provider_misconfigured', 'The provider’s key address must be https.');
  const f = cfg.fetchImpl ?? fetch;
  let res: Response;
  try { res = await f(p.jwksUri, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) }); } catch { throw new OAuthError('provider_unreachable', 'Could not reach the sign-in provider.'); }
  const jwks = (await res.json().catch(() => null)) as Jwks | null;
  if (!res.ok || !jwks || !Array.isArray(jwks.keys)) throw new OAuthError('provider_unreachable', 'The provider’s signing keys could not be read.');
  jwksCache.set(p.jwksUri, { at: Date.now(), jwks });
  return jwks;
}
export const clearKeyCache = () => jwksCache.clear();

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;

/**
 * Checks an ID token and returns its claims. Only RS256 and ES256 are accepted (never "none" or a shared-secret algorithm), the signature must verify against a key the
 * provider publishes, and the issuer, audience, expiry and nonce must all be right.
 */
export async function verifyIdToken(cfg: OAuthConfig, p: Provider, token: string, nonce: string, now = Date.now()): Promise<Claims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new OAuthError('bad_token', 'The sign-in token was not valid.');
  let header: Record<string, unknown>, claims: Claims;
  try { header = decode(parts[0]); claims = decode(parts[1]); } catch { throw new OAuthError('bad_token', 'The sign-in token was not valid.'); }
  const alg = header.alg;
  if (alg !== 'RS256' && alg !== 'ES256') throw new OAuthError('bad_token', 'The sign-in token used an algorithm that is not accepted.');
  const find = (jwks: Jwks) => jwks.keys.find((k) => k.kid === header.kid && (!k.alg || k.alg === alg));
  let jwk = find(await keysFor(cfg, p, false));
  if (!jwk) jwk = find(await keysFor(cfg, p, true)); // the provider may have rotated its keys since we last looked
  if (!jwk) throw new OAuthError('bad_token', 'The sign-in token was signed with an unknown key.');
  let ok = false;
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    const v = createVerify('sha256'); v.update(`${parts[0]}.${parts[1]}`);
    ok = v.verify(alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key, Buffer.from(parts[2], 'base64url'));
  } catch { ok = false; }
  if (!ok) throw new OAuthError('bad_token', 'The sign-in token’s signature did not check out.');
  const aud = claims.aud;
  if (!(aud === p.clientId || (Array.isArray(aud) && aud.includes(p.clientId)))) throw new OAuthError('bad_token', 'The sign-in token was issued for a different app.');
  if (typeof claims.iss !== 'string' || !p.issuerOk(claims.iss, claims)) throw new OAuthError('bad_token', 'The sign-in token came from an unexpected issuer.');
  const exp = Number(claims.exp), iat = Number(claims.iat ?? 0);
  if (!Number.isFinite(exp) || exp * 1000 < now - 60_000) throw new OAuthError('bad_token', 'The sign-in token has expired.');
  if (iat && iat * 1000 > now + 300_000) throw new OAuthError('bad_token', 'The sign-in token is dated in the future.');
  if (claims.nonce !== nonce) throw new OAuthError('bad_token', 'The sign-in token did not match this sign-in attempt.');
  if (typeof claims.sub !== 'string' || !claims.sub) throw new OAuthError('bad_token', 'The sign-in token has no account id.');
  return claims;
}

/** The email to store for a new account, and whether the provider vouches for it. Without that promise the account gets a placeholder address, so no one can claim an address that is not theirs. */
export function accountEmail(p: Provider, claims: Claims): { email: string; verified: boolean } {
  const e = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (e && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && p.trustsEmailClaim(claims)) return { email: e, verified: true };
  const tag = createHash('sha256').update(`${p.id}|${claims.sub}`).digest('hex').slice(0, 24);
  return { email: `${p.id}-${tag}@sign-in.invalid`, verified: false };
}

export const displayNameOf = (claims: Claims): string | null => {
  const n = typeof claims.name === 'string' ? claims.name.trim() : '';
  return n ? n.slice(0, 80) : null;
};

export const publicProviders = (cfg: OAuthConfig) => (cfg.enabled ? cfg.providers.map((p) => ({ id: p.id, name: p.name })) : []);

/* ------------------------------------------------------------------ the native iOS sheet: code exchange and revocation */

/**
 * A stored Apple refresh token says which flow minted it: tokens from the native sheet carry this prefix, tokens from the web flow are stored bare.
 * Revocation must present the client id of the flow that minted the token (the bundle id for native tokens, the web Services ID for web tokens),
 * which is the same split the Dx Dash implementation uses.
 */
export const IOS_TOKEN_PREFIX = 'ios:';
export const markIosToken = (token: string) => IOS_TOKEN_PREFIX + token;
export const isIosToken = (token: string) => typeof token === 'string' && token.startsWith(IOS_TOKEN_PREFIX);
export const rawRefreshToken = (token: string) => (isIosToken(token) ? token.slice(IOS_TOKEN_PREFIX.length) : token);
export const revokeTarget = (marked: string, webClientId: string, bundleId: string) => (isIosToken(marked) ? bundleId : webClientId);

/** The form for swapping a one time code from the native sheet for a refresh token. The sheet flow has no redirect address and no PKCE verifier. */
export const appleCodeForm = (o: { code: string; clientId: string; clientSecret: string }) => new URLSearchParams({ grant_type: 'authorization_code', code: o.code, client_id: o.clientId, client_secret: o.clientSecret });

/** The form for handing a refresh token back to Apple when an account or a link is removed. */
export const appleRevokeForm = (o: { token: string; clientId: string; clientSecret: string }) => new URLSearchParams({ token: o.token, token_type_hint: 'refresh_token', client_id: o.clientId, client_secret: o.clientSecret });

const revokeEndpoint = (p: Provider) => p.tokenEndpoint.replace(/\/token$/, '/revoke');

/** Swaps a code from the native sheet for the refresh token the server keeps for later revocation. The provider passed in decides the client id (the bundle id for the sheet). */
export async function exchangeAppleCode(cfg: OAuthConfig, p: Provider, code: string): Promise<{ refreshToken: string }> {
  if (!secureOrLocal(cfg, p.tokenEndpoint)) throw new OAuthError('provider_misconfigured', 'The provider’s token address must be https.');
  const f = cfg.fetchImpl ?? fetch;
  let res: Response;
  try { res = await f(p.tokenEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: appleCodeForm({ code, clientId: p.clientId, clientSecret: p.clientSecret() }), signal: AbortSignal.timeout(10_000) }); }
  catch { throw new OAuthError('provider_unreachable', 'Could not reach the sign-in provider.'); }
  const data = (await res.json().catch(() => ({}))) as { refresh_token?: unknown };
  if (!res.ok || typeof data.refresh_token !== 'string') throw new OAuthError('exchange_failed', 'The sign-in provider did not accept the sign-in.');
  return { refreshToken: data.refresh_token };
}

/** Hands a stored refresh token back to Apple. The provider passed in must be the one revokeTarget picks for the stored token. Returns whether Apple accepted. */
export async function revokeAppleToken(cfg: OAuthConfig, p: Provider, markedToken: string): Promise<boolean> {
  const url = revokeEndpoint(p);
  if (!secureOrLocal(cfg, url)) throw new OAuthError('provider_misconfigured', 'The provider’s token address must be https.');
  const f = cfg.fetchImpl ?? fetch;
  let res: Response;
  try { res = await f(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: appleRevokeForm({ token: rawRefreshToken(markedToken), clientId: p.clientId, clientSecret: p.clientSecret() }), signal: AbortSignal.timeout(10_000) }); }
  catch { throw new OAuthError('provider_unreachable', 'Could not reach the sign-in provider.'); }
  return res.ok;
}
