import { describe, expect, it, vi } from 'vitest';
import { LoggingEventBus } from './logging.ts';
import type { EventID } from './type.ts';

const event = {
  id: 'event-id' as EventID,
  eventName: 'test.created',
  target: 'target-id',
  actor: 'actor-id',
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
  payload: { secret: 'must not be logged' },
};

describe('LoggingEventBus', () => {
  it('logs event metadata without the payload', () => {
    const info = vi.fn();
    const eventBus = new LoggingEventBus({ info });

    const result = eventBus.publish(event);

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
    const eventBus = new LoggingEventBus({
      info: () => {
        throw new Error('logging failed');
      },
    });

    expect(() => eventBus.publish(event)).not.toThrow();
  });
});
