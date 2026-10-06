import { Ether } from '@mikuroxina/mini-fn';

import { InMemoryEventBus } from './inmemory.ts';
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

const inMemoryEventBus = new InMemoryEventBus();
export const eventPublisher = new ConfigurableEventPublisher(inMemoryEventBus);
export const eventSubscriber = inMemoryEventBus;

export const eventPublisherEther = Ether.newEther(
  eventPublisherSymbol,
  () => eventPublisher,
);

/** Replaces the in-process publisher with the configured application transport. */
export function configureEventPublisher(publisher: EventPublisher): void {
  eventPublisher.setPublisher(publisher);
}
