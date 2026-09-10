import { Ether } from '@mikuroxina/mini-fn';
import { Logger } from 'tslog';

import { type EventBus, eventBusSymbol } from './bus.ts';
import type { AnyDomainEvent } from './type.ts';

export interface EventLogger {
  info(...args: unknown[]): unknown;
}

/**
 * Initial event bus implementation. It only writes event metadata to the
 * application log and deliberately excludes the event payload.
 */
export class LoggingEventBus implements EventBus {
  readonly #logger: EventLogger;

  constructor(logger: EventLogger) {
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

const eventBusLogger = new Logger({
  type: 'pretty',
  name: 'EventBus',
});

export const eventBus = new LoggingEventBus(eventBusLogger);

export const eventBusEther = Ether.newEther(eventBusSymbol, () => eventBus);
