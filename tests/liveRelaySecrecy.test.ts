import { describe, expect, it } from 'vitest';
import { newRoomSecret, open, playerTopic, roomKey, seal, topicRoot } from '../src/live/crypt';

describe('live relay secrecy: the code alone names and opens nothing', () => {
  it('makes a different topic and a different key for the same code under another room secret', async () => {
    const a = roomKey('123456', 'ABCD2345');
    const b = roomKey('123456', 'WXYZ6789');
    expect(await topicRoot(a)).not.toBe(await topicRoot(b));
    expect(await topicRoot(a)).toBe(await topicRoot(roomKey('123456', 'ABCD2345')));
    const sealed = await seal(a, { t: 'view', mark: 'class data' });
    expect(await open(b, sealed)).toBeNull();
    expect(await open('123456', sealed)).toBeNull();
    expect(await open(a, sealed)).toMatchObject({ mark: 'class data' });
  });

  it('never puts the player token in the topic name, and keeps the name stable per token', async () => {
    const root = await topicRoot(roomKey('123456', 'ABCD2345'));
    const token = '0123456789abcdef0123456789abcdef';
    const topic = await playerTopic(root, token);
    expect(topic.startsWith(`${root}/p/`)).toBe(true);
    expect(topic).not.toContain(token);
    expect(await playerTopic(root, token)).toBe(topic);
    expect(await playerTopic(root, 'fedcba9876543210fedcba9876543210')).not.toBe(topic);
  });

  it('room secrets are eight characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 100; i++) expect(newRoomSecret()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  });
});
