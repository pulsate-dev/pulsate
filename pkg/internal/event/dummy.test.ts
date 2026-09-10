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

describe('DummyEventPublisher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs event metadata without the payload', () => {
    const info = vi
      .spyOn(eventModuleLogger, 'info')
      .mockImplementation(() => undefined);
    const eventPublisher = new DummyEventPublisher();

    const result = eventPublisher.publish(event);

    expect(result).toBeUndefined();
    expect(info).toHaveBeenCalledWith('Domain event published', {
      id: event.id,
      eventName: event.eventName,
      target: event.target,
      actor: event.actor,
      occurredAt: event.occurredAt,
    });
  });
});
