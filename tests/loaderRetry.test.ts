import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJson } from '../src/data/loader';

afterEach(() => vi.unstubAllGlobals());

describe('JSON resource retry', () => {
  it('does not cache a 404 as a successful empty resource', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('{"ready":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const path = 'retry-fixture-404.json';
    await expect(getJson(path)).resolves.toBeNull();
    await expect(getJson(path)).resolves.toEqual({ ready: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a successful HTTP response whose JSON body is null', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('null', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"ready":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const path = 'retry-fixture-null.json';
    await expect(getJson(path)).resolves.toBeNull();
    await expect(getJson(path)).resolves.toEqual({ ready: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
