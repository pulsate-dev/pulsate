import { Ether } from '@mikuroxina/mini-fn';
import { Logger } from 'tslog';

import { type EventPublisher, eventPublisherSymbol } from './publisher.ts';
import type { AnyDomainEvent } from './type.ts';

/**
 * Publishes event metadata with a logger and deliberately excludes the event
 * payload.
 */
export class LoggerEventPublisher implements EventPublisher {
  readonly #logger: Logger<unknown>;

  constructor(logger: Logger<unknown>) {
    this.#logger = logger;
  }

  publish(event: AnyDomainEvent): void {
    try {
      this.#logger.info('Domain event published', {
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

const eventPublisherLogger = new Logger<unknown>({
  type: 'pretty',
  name: 'EventPublisher',
});

export const eventPublisher = new LoggerEventPublisher(eventPublisherLogger);

export const eventPublisherEther = Ether.newEther(
  eventPublisherSymbol,
  () => eventPublisher,
);
