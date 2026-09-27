import { Result } from '@mikuroxina/mini-fn';

import type {
  EventSubscriber,
  EventSubscription,
  EventSubscriptionOptions,
} from '../../subscriber.ts';
import type { NatsEventClient } from './client.ts';
import { getConsumer } from './consumer.ts';
import { RunningSubscription } from './subscription.ts';

/** A stream-scoped subscriber; each logical handler has its own durable. */
export class NatsEventSubscriber implements EventSubscriber {
  readonly #client: NatsEventClient;
  readonly #stream: string;

  constructor(client: NatsEventClient, stream: string) {
    this.#client = client;
    this.#stream = stream;
  }

  async subscribe(
    options: EventSubscriptionOptions,
  ): Promise<Result.Result<Error, EventSubscription>> {
    if (!this.#stream) {
      return Result.err(new Error('Stream name is required'));
    }

    const consumer = await getConsumer(this.#client, this.#stream, options);
    if (Result.isErr(consumer)) {
      return consumer;
    }

    const runningConsumer = Result.unwrap(consumer);
    return Result.ok(new RunningSubscription(runningConsumer, options));
  }
}
