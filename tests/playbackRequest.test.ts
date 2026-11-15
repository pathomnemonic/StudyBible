import { describe, expect, it } from 'vitest';
import { resolveIfCurrent } from '../src/data/playbackRequest';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('playback request race protection', () => {
  it('ignores an older source lookup when requests resolve in reverse order', async () => {
    let generation = 0;
    const first = deferred<string>();
    const second = deferred<string>();
    const firstRequest = ++generation;
    const firstResult = resolveIfCurrent(firstRequest, () => generation, () => first.promise);
    const secondRequest = ++generation;
    const secondResult = resolveIfCurrent(secondRequest, () => generation, () => second.promise);

    second.resolve('https://cdn.example/second.mp3');
    await expect(secondResult).resolves.toBe('https://cdn.example/second.mp3');
    first.resolve('https://cdn.example/first.mp3');
    await expect(firstResult).resolves.toBeNull();
  });

  it('does not let a delayed imported local-file lookup replace a newer remote episode', async () => {
    let generation = 0;
    const localBlob = deferred<string>();
    const remoteUrl = deferred<string>();
    const localRequest = ++generation;
    const localResult = resolveIfCurrent(localRequest, () => generation, () => localBlob.promise);
    const remoteRequest = ++generation;
    const remoteResult = resolveIfCurrent(remoteRequest, () => generation, () => remoteUrl.promise);

    remoteUrl.resolve('https://publisher.example/episode.mp3');
    await expect(remoteResult).resolves.toBe('https://publisher.example/episode.mp3');
    localBlob.resolve('blob:local-imported-audio');
    await expect(localResult).resolves.toBeNull();
  });


  it('suppresses a rejection from a source lookup that is stale by the time it fails', async () => {
    let generation = 0;
    const pending = deferred<string>();
    const request = ++generation;
    const result = resolveIfCurrent(request, () => generation, () => pending.promise);
    generation++;
    pending.reject(new Error('old local file disappeared'));
    await expect(result).resolves.toBeNull();
  });

  it('does not let an expired sleep timer restart a pending source request', async () => {
    let generation = 4;
    const activeSourceGeneration = generation;
    const pending = resolveIfCurrent(activeSourceGeneration, () => generation, async () => 'late audio URL');
    generation++; // the minute timer expires and invalidates pending playback
    await expect(pending).resolves.toBeNull();
  });

  it('does not adopt a newer pending request as the ended source generation', async () => {
    let requestedGeneration = 0;
    const activeSourceGeneration = requestedGeneration;
    requestedGeneration++; // episode B is requested, but its source lookup has not resolved
    const queue = await resolveIfCurrent(
      activeSourceGeneration,
      () => requestedGeneration,
      async () => ['stale-queued-episode'],
    );
    expect(queue).toBeNull();
  });

  it('does not advance an ended episode queue over a newer user selection', async () => {
    let generation = 0;
    const pendingQueue = deferred<string[]>();
    const request = ++generation;
    const queueResult = resolveIfCurrent(request, () => generation, () => pendingQueue.promise);
    // The user selects another episode while the ended handler is reading the queue.
    generation++;
    pendingQueue.resolve(['older-queued-episode']);
    const queue = await queueResult;
    const started: string[] = [];
    if (queue !== null) started.push(...queue);
    expect(queue).toBeNull();
    expect(started).toEqual([]);
  });

  it('invalidates an in-flight lookup when playback is stopped', async () => {
    let generation = 0;
    const pending = deferred<string>();
    const request = ++generation;
    const result = resolveIfCurrent(request, () => generation, () => pending.promise);
    generation++;
    pending.resolve('https://publisher.example/episode.mp3');
    await expect(result).resolves.toBeNull();
  });
});
