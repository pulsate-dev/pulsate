import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

export interface EventPublisher {
  /** Publishes a domain event without propagating publishing errors. */
  publish(event: AnyDomainEvent): void;
}

export const eventPublisherSymbol = Ether.newEtherSymbol<EventPublisher>();
