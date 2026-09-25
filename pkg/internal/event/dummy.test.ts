import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventModuleLogger } from './adaptor/logger.ts';
import { DummyEventPublisher } from './dummy.ts';
import type { EventID } from './type.ts';

const event = {
  id: 'event-id' as EventID,
  eventName: 'test.created',
  target: 'target-id',
  actor: 'actor-id',
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
  payload: { secret: 'must not be logged' },
};

const anotherEvent = {
  id: 'event-id-2' as EventID,
  eventName: 'test.updated',
  target: 'target-id',
  actor: 'actor-id',
  occurredAt: new Date('2026-01-02T00:00:00.000Z'),
  payload: { secret: 'must not be logged' },
};

describe('DummyEventPublisher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs event metadata without the payload', async () => {
    const info = vi
      .spyOn(eventModuleLogger, 'info')
      .mockImplementation(() => undefined);
    const eventPublisher = new DummyEventPublisher();

    const result = await eventPublisher.publishMany([event]);

    expect(result).toBeUndefined();
    expect(info).toHaveBeenCalledWith('Domain event published', {
      id: event.id,
      eventName: event.eventName,
      target: event.target,
      actor: event.actor,
      occurredAt: event.occurredAt,
    });
  });

  it('logs metadata for every event when publishing many', async () => {
    const info = vi
      .spyOn(eventModuleLogger, 'info')
      .mockImplementation(() => undefined);
    const eventPublisher = new DummyEventPublisher();

    const result = await eventPublisher.publishMany([event, anotherEvent]);

    expect(result).toBeUndefined();
    expect(info).toHaveBeenNthCalledWith(1, 'Domain event published', {
      id: event.id,
      eventName: event.eventName,
      target: event.target,
      actor: event.actor,
      occurredAt: event.occurredAt,
    });
    expect(info).toHaveBeenNthCalledWith(2, 'Domain event published', {
      id: anotherEvent.id,
      eventName: anotherEvent.eventName,
      target: anotherEvent.target,
      actor: anotherEvent.actor,
      occurredAt: anotherEvent.occurredAt,
    });
  });

  it('logs nothing when publishing an empty list', async () => {
    const info = vi
      .spyOn(eventModuleLogger, 'info')
      .mockImplementation(() => undefined);
    const eventPublisher = new DummyEventPublisher();

    await eventPublisher.publishMany([]);

    expect(info).not.toHaveBeenCalled();
  });
});
