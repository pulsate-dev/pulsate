import { Result } from '@mikuroxina/mini-fn';

import type { EventPublisher } from '../../publisher.ts';
import type { AnyDomainEvent } from '../../type.ts';
import { eventModuleLogger } from '../logger.ts';
import type { NatsEventClient } from './client.ts';
import { encodeEvent } from './codec.ts';

export class NatsEventPublisher implements EventPublisher {
  readonly #client: NatsEventClient;
  constructor(client: NatsEventClient) {
    this.#client = client;
  }

  async publishMany(events: readonly AnyDomainEvent[]): Promise<void> {
    for (const event of events) {
      const published = await Result.wrapAsyncThrowable((cause) =>
        cause instanceof Error ? cause : new Error(String(cause)),
      )(() =>
        this.#client.jetstream.publish(event.eventName, encodeEvent(event), {
          msgID: event.id,
        }),
      )();

      if (Result.isErr(published)) {
        const error = Result.unwrapErr(published);
        eventModuleLogger.error('Domain event publish failed', {
          id: event.id,
          eventName: event.eventName,
          error: { name: error.name, message: error.message },
        });
      }
    }
  }
}
