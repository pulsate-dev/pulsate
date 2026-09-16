import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

export interface EventPublisher {
  /** Publishes domain events, e.g. as a single batch/transaction. */
  publishMany(events: readonly AnyDomainEvent[]): void;
}

export const eventPublisherSymbol = Ether.newEtherSymbol<EventPublisher>();
