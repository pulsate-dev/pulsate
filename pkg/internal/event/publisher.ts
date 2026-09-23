import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

export interface EventPublisher {
  /** Waits for every event to be published (or logged on failure). */
  publishMany(events: readonly AnyDomainEvent[]): Promise<void>;
}

export const eventPublisherSymbol = Ether.newEtherSymbol<EventPublisher>();
