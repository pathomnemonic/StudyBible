import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SIGN_IN_MESSAGES } from '../src/components/SignInMethods';

// every reason the server can send the browser back with must have its own plain-language message, or the person sees a vague "did not work"
describe('sign-in result codes', () => {
  const server = readFileSync('server/app.ts', 'utf8') + readFileSync('server/oauth.ts', 'utf8');
  const codes = new Set<string>();
  for (const m of server.matchAll(/fail\('([a-z_]+)'\)/g)) codes.add(m[1]);
  for (const m of server.matchAll(/sign_in_error=([a-z_]+)/g)) codes.add(m[1]);
  for (const m of server.matchAll(/new OAuthError\('([a-z_]+)'/g)) codes.add(m[1]);
  // codes that mean "the provider or the token was not right" share one message on purpose
  const generic = new Set(['bad_token', 'exchange_failed', 'provider_error', 'provider_misconfigured']);
  it('finds the codes the server uses', () => { expect(codes.size).toBeGreaterThan(8); });
  it('has a message for every specific one', () => {
    const missing = [...codes].filter((c) => !generic.has(c) && !SIGN_IN_MESSAGES[c]);
    expect(missing).toEqual([]);
  });
});
