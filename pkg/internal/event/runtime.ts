import { Ether } from '@mikuroxina/mini-fn';
import { InMemoryEventTransport } from './local.ts';
import type { EventPublisher } from './publisher.ts';
import { eventPublisherSymbol } from './publisher.ts';

class ConfigurableEventPublisher implements EventPublisher {
  #publisher: EventPublisher;

  constructor(publisher: EventPublisher) {
    this.#publisher = publisher;
  }

  setPublisher(publisher: EventPublisher): void {
    this.#publisher = publisher;
  }

  publishMany(events: Parameters<EventPublisher['publishMany']>[0]) {
    return this.#publisher.publishMany(events);
  }
}

export const localEventTransport = new InMemoryEventTransport();
export const eventPublisher = new ConfigurableEventPublisher(
  localEventTransport,
);
export const eventSubscriber = localEventTransport;

export const eventPublisherEther = Ether.newEther(
  eventPublisherSymbol,
  () => eventPublisher,
);

/** Replaces the in-process publisher with the configured application transport. */
export function configureEventPublisher(publisher: EventPublisher): void {
  eventPublisher.setPublisher(publisher);
}

/** Resets the publisher to the in-process transport, primarily for tests. */
export function resetEventPublisher(): void {
  eventPublisher.setPublisher(localEventTransport);
}
