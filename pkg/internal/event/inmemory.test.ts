import { Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventModuleLogger } from './adaptor/logger.ts';
import { InMemoryEventBus } from './inmemory.ts';
import type { EventID } from './type.ts';

const event = {
  id: 'event-id' as EventID,
  eventName: 'note.created',
  target: 'note-id',
  actor: 'account-id',
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
  payload: { visibility: 'PUBLIC' },
};

describe('InMemoryEventBus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delivers matching valid events until the subscription is stopped', async () => {
    vi.spyOn(eventModuleLogger, 'info').mockImplementation(() => undefined);
    const bus = new InMemoryEventBus();
    const handler = vi.fn(async () => Result.ok(undefined));
    const subscription = await bus.subscribe({
      id: 'timeline-push-note-v1',
      subjects: ['note.created'],
      handler,
      validatePayload: () => true,
      ackWaitMs: 1000,
    });

    expect(Result.isOk(subscription)).toBe(true);
    await bus.publishMany([event]);
    expect(handler).toHaveBeenCalledWith(event);

    await Result.unwrap(subscription).stop();
    await bus.publishMany([event]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not deliver events rejected by the payload validator', async () => {
    vi.spyOn(eventModuleLogger, 'info').mockImplementation(() => undefined);
    const bus = new InMemoryEventBus();
    const handler = vi.fn(async () => Result.ok(undefined));
    await bus.subscribe({
      id: 'timeline-push-note-v1',
      subjects: ['note.created'],
      handler,
      validatePayload: () => false,
      ackWaitMs: 1000,
    });

    await bus.publishMany([event]);

    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects duplicate subscription IDs', async () => {
    const bus = new InMemoryEventBus();
    const options = {
      id: 'timeline-push-note-v1',
      subjects: ['note.created'],
      handler: async () => Result.ok(undefined),
      validatePayload: () => true,
      ackWaitMs: 1000,
    };

    await bus.subscribe(options);
    const duplicate = await bus.subscribe(options);

    expect(Result.isErr(duplicate)).toBe(true);
  });
});
