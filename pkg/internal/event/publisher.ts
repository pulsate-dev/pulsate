import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

/** Publishes domain events to the application's event transport. */
export interface EventPublisher {
  /** Waits for every event to be published or for its failure to be logged. */
  publishMany(events: readonly AnyDomainEvent[]): Promise<void>;
}

export const eventPublisherSymbol = Ether.newEtherSymbol<EventPublisher>();
