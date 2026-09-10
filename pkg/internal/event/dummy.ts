import { Ether } from '@mikuroxina/mini-fn';

import { eventModuleLogger } from './adaptor/logger.ts';
import { type EventPublisher, eventPublisherSymbol } from './publisher.ts';
import type { AnyDomainEvent } from './type.ts';

/**
 * Publishes event metadata with a logger and deliberately excludes the event
 * payload.
 */
export class DummyEventPublisher implements EventPublisher {
  publish(event: AnyDomainEvent): void {
    try {
      eventModuleLogger.info('Domain event published', {
        id: event.id,
        eventName: event.eventName,
        target: event.target,
        actor: event.actor,
        occurredAt: event.occurredAt,
      });
    } catch {
      // Event publishing must never make the originating operation fail.
      return;
    }
  }
}

export const eventPublisher = new DummyEventPublisher();

export const eventPublisherEther = Ether.newEther(
  eventPublisherSymbol,
  () => eventPublisher,
);
