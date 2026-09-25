import { Result } from '@mikuroxina/mini-fn';
import type { Consumer, JsMsg as JetStreamMessage } from '@nats-io/jetstream';

import type {
  EventSubscription,
  EventSubscriptionOptions,
} from '../../subscriber.ts';
import type { AnyDomainEvent } from '../../type.ts';
import { eventModuleLogger } from '../logger.ts';
import { decodeEvent } from './codec.ts';
import { maxDeliver } from './consumer-config.ts';

const retryDelaysMs = [1000, 2000, 4000, 8000] as const;
const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));
const attempt = Result.wrapAsyncThrowable(toError);

export class RunningSubscription implements EventSubscription {
  #stopping = false;
  readonly #finished: Promise<void>;
  readonly #consumer: Consumer;
  readonly #options: EventSubscriptionOptions;

  constructor(consumer: Consumer, options: EventSubscriptionOptions) {
    this.#consumer = consumer;
    this.#options = options;
    this.#finished = this.#run();
  }

  async stop(): Promise<Result.Result<Error, void>> {
    this.#stopping = true;
    return attempt(() => this.#finished)();
  }

  async #run(): Promise<void> {
    while (!this.#stopping) {
      const fetched = await attempt(() =>
        this.#consumer.next({ expires: 1000 }),
      )();

      if (Result.isErr(fetched)) {
        if (this.#stopping) {
          return;
        }

        const error = Result.unwrapErr(fetched);
        eventModuleLogger.error('Event consumer fetch failed', {
          subscriptionId: this.#options.id,
          error: { name: error.name, message: error.message },
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        continue;
      }

      const message = Result.unwrap(fetched);
      if (!message) {
        continue;
      }

      // A delivered message must still be settled or left for redelivery.
      if (this.#stopping) {
        return;
      }

      const processed = await attempt(() => this.#process(message))();

      if (Result.isErr(processed)) {
        const error = Result.unwrapErr(processed);
        eventModuleLogger.error('Event message processing failed', {
          subscriptionId: this.#options.id,
          error: { name: error.name, message: error.message },
        });
      }
    }
  }

  async #process(message: JetStreamMessage): Promise<void> {
    const event = this.#parse(message);
    if (!event) {
      return;
    }

    const handled = await attempt(() => this.#options.handler(event))();
    if (Result.isErr(handled)) {
      return this.#retry(message, event, Result.unwrapErr(handled));
    }

    const result = Result.unwrap(handled);
    if (Result.isErr(result)) {
      return this.#retry(message, event, Result.unwrapErr(result));
    }

    message.ack();
  }

  #parse(message: JetStreamMessage): AnyDomainEvent | undefined {
    const decoded = decodeEvent(
      message,
      this.#options.subjects,
      this.#options.validatePayload,
    );

    if (Result.isErr(decoded)) {
      const error = Result.unwrapErr(decoded);
      eventModuleLogger.error('Invalid domain event; terminating delivery', {
        subscriptionId: this.#options.id,
        subject: message.subject,
        error: { name: error.name, message: error.message },
      });

      message.term();
      return undefined;
    }

    return Result.unwrap(decoded);
  }

  #retry(
    message: JetStreamMessage,
    event: AnyDomainEvent,
    cause: unknown,
  ): void {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    const attempts = message.info.deliveryCount;

    if (attempts >= maxDeliver) {
      eventModuleLogger.error('Domain event delivery exhausted', {
        id: event.id,
        eventName: event.eventName,
        subscriptionId: this.#options.id,
        attempts,
        error: { name: error.name, message: error.message },
      });
      message.term();
    } else {
      message.nak(retryDelaysMs[attempts - 1] ?? retryDelaysMs[3]);
    }
  }
}
