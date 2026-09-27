import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { EventSubscriptionOptions } from '../../subscriber.ts';
import type { NatsEventClient } from './client.ts';
import { getConsumer } from './consumer.ts';

const options: EventSubscriptionOptions = {
  id: 'timeline-push-note-v1',
  subjects: ['note.created', 'note.renoted'],
  ackWaitMs: 30_000,
  validatePayload: () => true,
  handler: async () => {
    throw new Error('not called');
  },
};

describe('getConsumer subscription validation', () => {
  it.each([
    { id: 'Timeline-Push-v1' },
    { subjects: [] },
    { subjects: ['note.created', 'note.created'] },
    { subjects: ['note.*'] },
    { ackWaitMs: 999 },
    { ackWaitMs: Number.MAX_SAFE_INTEGER + 1 },
    { validatePayload: undefined },
  ])(
    'rejects invalid options before connecting to JetStream',
    async (invalid) => {
      const result = await getConsumer({} as NatsEventClient, 'EVENTS', {
        ...options,
        ...invalid,
      } as EventSubscriptionOptions);
      expect(Result.unwrapErr(result).message).toBe(
        'Invalid event subscription options',
      );
    },
  );
});
