import { Cat, Promise, Result } from '@mikuroxina/mini-fn';
import {
  type Consumer,
  type ConsumerAPI,
  type ConsumerConfig,
  JetStreamApiCodes,
  JetStreamApiError,
} from '@nats-io/jetstream';

import type { EventSubscriptionOptions } from '../../subscriber.ts';
import type { NatsEventClient } from './client.ts';
import {
  checkConsumerConfig,
  createConsumerConfig,
  validateSubscription,
} from './consumer-config.ts';

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));
const attempt = Result.wrapAsyncThrowable(toError);

async function findConfig(
  api: ConsumerAPI,
  stream: string,
  id: string,
): Promise<Result.Result<Error, ConsumerConfig | undefined>> {
  const info = await attempt(() => api.info(stream, id))();
  if (Result.isOk(info)) {
    const consumerInfo = Result.unwrap(info);
    return Result.ok(consumerInfo.config);
  }
  const error = Result.unwrapErr(info);

  return error instanceof JetStreamApiError &&
    error.code === JetStreamApiCodes.ConsumerNotFound
    ? Result.ok(undefined)
    : Result.err(error);
}

async function ensureConfig(
  api: ConsumerAPI,
  stream: string,
  config: ConsumerConfig,
  id: string,
): Promise<Result.Result<Error, ConsumerConfig>> {
  const existing = await findConfig(api, stream, id);
  if (Result.isErr(existing)) {
    return existing;
  }

  const existingConfig = Result.unwrap(existing);
  if (existingConfig) {
    return Result.ok(existingConfig);
  }

  const created = await attempt(() => api.add(stream, config))();
  if (Result.isOk(created)) {
    const consumerInfo = Result.unwrap(created);
    return Result.ok(consumerInfo.config);
  }
  const createError = Result.unwrapErr(created);

  // Another replica may have created the durable concurrently.
  const concurrent = await findConfig(api, stream, id);
  if (Result.isErr(concurrent)) {
    return Result.err(createError);
  }

  const concurrentConfig = Result.unwrap(concurrent);
  if (concurrentConfig) {
    return Result.ok(concurrentConfig);
  }

  return Result.err(createError);
}

/** Create or check a durable without updating an existing consumer. */
export async function getConsumer(
  client: NatsEventClient,
  stream: string,
  options: EventSubscriptionOptions,
): Promise<Result.Result<Error, Consumer>> {
  const valid = validateSubscription(options);
  if (Result.isErr(valid)) {
    return valid;
  }
  const config = createConsumerConfig(options);
  const monad = Promise.resultMonad<Error>();

  return Cat.doT(monad)
    .addM('manager', attempt(() => client.jetstream.jetstreamManager())())
    .addMWith('config', ({ manager }) =>
      ensureConfig(manager.consumers, stream, config, options.id),
    )
    .runWith(({ config: consumerConfig }) =>
      Promise.resolve(checkConsumerConfig(consumerConfig, options)).then(
        Result.map(() => []),
      ),
    )
    .addMWith('consumer', () =>
      attempt(() => client.jetstream.consumers.get(stream, options.id))(),
    )
    .finish(({ consumer }) => consumer);
}
