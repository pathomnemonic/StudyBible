/** Checks the server's environment before it starts, so a bad setting stops it early instead of failing quietly later. */
import { providersFromEnv } from './oauth';

export interface EnvCheck { errors: string[]; warnings: string[] }

export function checkEnv(env: Record<string, string | undefined>): EnvCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const port = Number(env.PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push(`PORT must be a whole number from 1 to 65535 (got “${env.PORT}”).`);
  const days = Number(env.SESSION_DAYS ?? 60);
  if (!Number.isFinite(days) || days < 1 || days > 365) errors.push(`SESSION_DAYS must be between 1 and 365 (got “${env.SESSION_DAYS}”).`);
  if (env.REGISTRATION && !['open', 'closed'].includes(env.REGISTRATION)) errors.push(`REGISTRATION must be “open” or “closed” (got “${env.REGISTRATION}”).`);
  if (env.COOKIE_SECURE && !['auto', 'true', 'false'].includes(env.COOKIE_SECURE)) errors.push(`COOKIE_SECURE must be auto, true or false (got “${env.COOKIE_SECURE}”).`);
  if (env.HOST && /\s/.test(env.HOST)) errors.push('HOST must not contain spaces.');
  for (const o of (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    try { const u = new URL(o); if (u.origin !== o) errors.push(`ALLOWED_ORIGINS entry “${o}” must be just an origin, such as https://example.org.`); } catch { errors.push(`ALLOWED_ORIGINS entry “${o}” is not a valid origin.`); }
  }
  const publicHost = !!env.HOST && !['127.0.0.1', 'localhost', '::1'].includes(env.HOST);
  if (publicHost && env.COOKIE_SECURE === 'false') warnings.push('The server listens on a public address with COOKIE_SECURE=false, so sign-in cookies travel without HTTPS protection. Put it behind HTTPS.');
  if (publicHost && env.REGISTRATION === 'open') warnings.push('Registration is open on a public address: anyone who finds the server can create an account. Set REGISTRATION=closed once your own account exists.');
  if (env.TRUST_PROXY === '1' && !publicHost) warnings.push('TRUST_PROXY=1 believes X-Forwarded-For. Only use it when a proxy you control sets that header.');
  if (!env.DB_PATH) warnings.push('DB_PATH is not set; the database will be at ./server-data/studybible.sqlite. Back that folder up (see docs/SERVER.md).');
  // sign in with Google and other providers: off unless OAUTH=on
  if (env.OAUTH && !['on', 'off'].includes(env.OAUTH)) errors.push(`OAUTH must be “on” or “off” (got “${env.OAUTH}”).`);
  const configured = providersFromEnv(env);
  if (env.OAUTH === 'on') {
    errors.push(...configured.errors);
    if (!env.PUBLIC_URL) errors.push('OAUTH=on needs PUBLIC_URL, the address people use to reach the app (for example https://study.example.org). Providers send people back to it.');
    else {
      try {
        const u = new URL(env.PUBLIC_URL);
        const local = ['localhost', '127.0.0.1'].includes(u.hostname);
        if (u.protocol !== 'https:' && !local) errors.push('PUBLIC_URL must start with https:// (http is only allowed for localhost).');
        if (u.pathname !== '/' || u.search || u.hash) errors.push('PUBLIC_URL must be just the address, with no path (for example https://study.example.org).');
      } catch { errors.push(`PUBLIC_URL “${env.PUBLIC_URL}” is not a valid address.`); }
    }
    if (!configured.providers.length && !configured.errors.length) errors.push('OAUTH=on but no provider is configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (or another provider’s settings; see docs/SIGN_IN_PROVIDERS.md).');
  } else if (configured.providers.length || configured.errors.length) {
    warnings.push('Sign-in provider settings are present but OAUTH is not “on”, so they are ignored.');
  }
  return { errors, warnings };
}
