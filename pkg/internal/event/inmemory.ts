import { Result } from '@mikuroxina/mini-fn';

import { eventModuleLogger } from './adaptor/logger.ts';
import type { EventPublisher } from './publisher.ts';
import type {
  EventSubscriber,
  EventSubscription,
  EventSubscriptionOptions,
} from './subscriber.ts';
import type { AnyDomainEvent } from './type.ts';

/** In-process event bus for development and tests. */
export class InMemoryEventBus implements EventPublisher, EventSubscriber {
  readonly #subscriptions = new Map<string, EventSubscriptionOptions>();

  async publishMany(
    events: readonly AnyDomainEvent[],
  ): Promise<Result.Result<Error, void>> {
    for (const event of events) {
      eventModuleLogger.info('Domain event published', {
        id: event.id,
        eventName: event.eventName,
        target: event.target,
        actor: event.actor,
        occurredAt: event.occurredAt,
      });

      for (const options of this.#subscriptions.values()) {
        if (!options.subjects.includes(event.eventName)) {
          continue;
        }

        try {
          if (!options.validatePayload(event)) {
            continue;
          }
        } catch {
          // Invalid events are ignored just like messages rejected by the NATS
          // codec. The event payload is intentionally not logged.
          continue;
        }

        try {
          const handled = await options.handler(event);
          if (Result.isErr(handled)) {
            eventModuleLogger.error('Domain event handling failed', {
              id: event.id,
              eventName: event.eventName,
              error: {
                name: Result.unwrapErr(handled).name,
                message: Result.unwrapErr(handled).message,
              },
            });
          }
        } catch (cause) {
          const error =
            cause instanceof Error ? cause : new Error(String(cause));
          eventModuleLogger.error('Domain event handling failed', {
            id: event.id,
            eventName: event.eventName,
            error: { name: error.name, message: error.message },
          });
        }
      }
    }

    return Result.ok(undefined);
  }

  async subscribe(
    options: EventSubscriptionOptions,
  ): Promise<Result.Result<Error, EventSubscription>> {
    if (this.#subscriptions.has(options.id)) {
      return Result.err(
        new Error(`Subscription already exists: ${options.id}`),
      );
    }

    this.#subscriptions.set(options.id, options);
    eventModuleLogger.info('Domain event subscription started', {
      id: options.id,
      subjects: options.subjects,
    });

    return Result.ok({
      stop: async () => {
        this.#subscriptions.delete(options.id);
        return Result.ok(undefined);
      },
    });
  }
}
