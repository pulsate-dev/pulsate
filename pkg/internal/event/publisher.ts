import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

/** Publishes domain events to the application's event transport. */
export interface EventPublisher {
  /** Waits for every event to be published; rejects on the first failure. */
  publishMany(events: readonly AnyDomainEvent[]): Promise<void>;
}

export const eventPublisherSymbol = Ether.newEtherSymbol<EventPublisher>();
