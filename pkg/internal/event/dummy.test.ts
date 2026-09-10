import { Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

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
  it('logs event metadata without the payload', () => {
    const logger = new Logger();
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const eventPublisher = new DummyEventPublisher(logger);

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

  it('does not throw when logging fails', () => {
    const logger = new Logger();
    vi.spyOn(logger, 'info').mockImplementation(() => {
      throw new Error('logging failed');
    });
    const eventPublisher = new DummyEventPublisher(logger);

    expect(() => eventPublisher.publish(event)).not.toThrow();
  });
});
