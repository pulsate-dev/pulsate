import { Ether } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

/**
 * Publishes domain events without exposing the underlying transport.
 *
 * Publishing is best effort. Implementations must not let publishing errors
 * affect the operation that produced the event.
 */
export interface EventBus {
  publish(event: AnyDomainEvent): void;
}

export const eventBusSymbol = Ether.newEtherSymbol<EventBus>();
