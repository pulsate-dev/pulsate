import { Ether, Result } from '@mikuroxina/mini-fn';

import { eventModuleLogger } from './adaptor/logger.ts';
import { type EventPublisher, eventPublisherSymbol } from './publisher.ts';
import {
  type EventSubscriber,
  type EventSubscription,
  type EventSubscriptionOptions,
  eventSubscriberSymbol,
} from './subscriber.ts';
import type { AnyDomainEvent } from './type.ts';

/**
 * Publishes event metadata with a logger and deliberately excludes the event
 * payload.
 */
export class DummyEventPublisher implements EventPublisher {
  #publish(event: AnyDomainEvent): void {
    eventModuleLogger.info('Domain event published', {
      id: event.id,
      eventName: event.eventName,
      target: event.target,
      actor: event.actor,
      occurredAt: event.occurredAt,
    });
  }

  async publishMany(
    events: readonly AnyDomainEvent[],
  ): Promise<Result.Result<Error, void>> {
    for (const event of events) {
      this.#publish(event);
    }
    return Result.ok(undefined);
  }
}

export const eventPublisher = new DummyEventPublisher();

export const eventPublisherEther = Ether.newEther(
  eventPublisherSymbol,
  () => eventPublisher,
);

/**
 * Logs subscription requests without delivering any event. Intended for
 * environments without an event transport (development, tests).
 */
export class DummyEventSubscriber implements EventSubscriber {
  async subscribe(
    options: EventSubscriptionOptions,
  ): Promise<Result.Result<Error, EventSubscription>> {
    eventModuleLogger.info('Domain event subscription started', {
      id: options.id,
      subjects: options.subjects,
    });
    return Result.ok({
      stop: async () => Result.ok(undefined),
    });
  }
}

export const eventSubscriber = new DummyEventSubscriber();

export const eventSubscriberEther = Ether.newEther(
  eventSubscriberSymbol,
  () => eventSubscriber,
);
