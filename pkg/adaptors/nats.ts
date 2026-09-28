import { Result } from '@mikuroxina/mini-fn';
import { JetStreamApiCodes, JetStreamApiError } from '@nats-io/jetstream';
import { NatsEventClient } from '../internal/event/adaptor/nats/client.ts';
import { collectEventNames } from '../internal/event/eventNames.ts';

const natsUrl = process.env.NATS_URL || 'localhost:4222';

/**
 * @description JetStream stream that carries every domain event.
 */
export const natsStreamName = process.env.NATS_STREAM || 'PULSATE_EVENTS';
export const natsStreamSubjects = collectEventNames();

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));
const attempt = Result.wrapAsyncThrowable(toError);

/**
 * @description Owns the single NATS connection shared by publishers and
 * subscribers. A class field (rather than a module-level `let`) holds the
 * lazily-created connection promise.
 */
class NatsConnectionHolder {
  #clientPromise: Promise<Result.Result<Error, NatsEventClient>> | undefined;

  connect(): Promise<Result.Result<Error, NatsEventClient>> {
    this.#clientPromise ??= NatsEventClient.connect({ servers: natsUrl });
    return this.#clientPromise;
  }

  async close(): Promise<Result.Result<Error, void>> {
    if (!this.#clientPromise) {
      return Result.ok(undefined);
    }
    const client = await this.#clientPromise;
    return Result.isOk(client)
      ? Result.unwrap(client).close()
      : Result.ok(undefined);
  }
}

const connectionHolder = new NatsConnectionHolder();

/**
 * @description Connects to NATS once and reuses the connection across
 * publishers and subscribers.
 */
export function connectNats(): Promise<Result.Result<Error, NatsEventClient>> {
  return connectionHolder.connect();
}

export function closeNatsClient(): Promise<Result.Result<Error, void>> {
  return connectionHolder.close();
}

/**
 * @description Creates the shared event stream if it does not exist yet.
 * Leaves an existing stream's configuration untouched.
 */
export async function ensureStream(
  client: NatsEventClient,
): Promise<Result.Result<Error, void>> {
  const manager = await attempt(() => client.jetstream.jetstreamManager())();
  if (Result.isErr(manager)) {
    return manager;
  }
  const streams = Result.unwrap(manager).streams;

  const info = await attempt(() => streams.info(natsStreamName))();
  if (Result.isOk(info)) {
    return Result.ok(undefined);
  }
  const infoError = Result.unwrapErr(info);
  if (
    !(
      infoError instanceof JetStreamApiError &&
      infoError.code === JetStreamApiCodes.StreamNotFound
    )
  ) {
    return Result.err(infoError);
  }

  const created = await attempt(() =>
    streams.add({
      name: natsStreamName,
      subjects: [...natsStreamSubjects],
    }),
  )();
  return Result.isErr(created) ? created : Result.ok(undefined);
}
