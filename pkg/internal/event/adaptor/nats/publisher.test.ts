import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EventID } from '../../type.ts';
import { eventModuleLogger } from '../logger.ts';
import type { NatsEventClient } from './client.ts';
import { NatsEventPublisher } from './publisher.ts';

const event = (id: string) => ({
  id: id as EventID,
  eventName: 'note.created',
  target: 'note-1',
  actor: 'account-1',
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
  payload: { secret: 'not for logs' },
});

describe('NatsEventPublisher', () => {
  afterEach(() => vi.restoreAllMocks());

  it('publishes events with deduplication IDs', async () => {
    const publish = vi.fn().mockResolvedValue({});
    const publisher = new NatsEventPublisher({
      jetstream: { publish },
    } as unknown as NatsEventClient);
    await publisher.publishMany([event('event-1')]);

    expect(publish).toHaveBeenCalledWith(
      'note.created',
      expect.any(Uint8Array),
      { msgID: 'event-1' },
    );
    expect(
      JSON.parse(new TextDecoder().decode(publish.mock.calls[0]?.[1])),
    ).toEqual({
      ...event('event-1'),
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('logs failures safely and continues the batch', async () => {
    const publish = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({});
    const log = vi
      .spyOn(eventModuleLogger, 'error')
      .mockImplementation(() => undefined);
    const publisher = new NatsEventPublisher({
      jetstream: { publish },
    } as unknown as NatsEventClient);

    await expect(
      publisher.publishMany([event('event-1'), event('event-2')]),
    ).resolves.toBeUndefined();
    expect(publish).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith('Domain event publish failed', {
      id: 'event-1',
      eventName: 'note.created',
      error: { name: 'Error', message: 'offline' },
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('not for logs');
  });
});
