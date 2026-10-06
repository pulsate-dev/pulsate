import { Result } from '@mikuroxina/mini-fn';
import { JetStreamApiCodes, JetStreamApiError } from '@nats-io/jetstream';

import { NatsEventClient } from '../internal/event/adaptor/nats/client.ts';
import { collectEventNames } from '../internal/event/eventNames.ts';

const natsUrl = process.env.NATS_URL || 'localhost:4222';

export const natsStreamName = process.env.NATS_STREAM || 'PULSATE_EVENTS';
export const natsStreamSubjects = collectEventNames();

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));
const attempt = Result.wrapAsyncThrowable(toError);

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

export function connectNats(): Promise<Result.Result<Error, NatsEventClient>> {
  return connectionHolder.connect();
}

export function closeNatsClient(): Promise<Result.Result<Error, void>> {
  return connectionHolder.close();
}

function subjectPatternMatches(pattern: string, subject: string): boolean {
  const patternParts = pattern.split('.');
  const subjectParts = subject.split('.');

  const matchesParts = (
    patternIndex: number,
    subjectIndex: number,
  ): boolean => {
    if (patternIndex === patternParts.length) {
      return subjectIndex === subjectParts.length;
    }

    const part = patternParts[patternIndex];
    if (part === '>') {
      return subjectIndex < subjectParts.length;
    }

    return (
      subjectIndex < subjectParts.length &&
      (part === '*' || part === subjectParts[subjectIndex]) &&
      matchesParts(patternIndex + 1, subjectIndex + 1)
    );
  };

  return matchesParts(0, 0);
}

/** Creates the shared JetStream stream if it does not exist yet. */
export async function ensureNatsStream(
  client: NatsEventClient,
): Promise<Result.Result<Error, void>> {
  const manager = await attempt(() => client.jetstream.jetstreamManager())();
  if (Result.isErr(manager)) {
    return manager;
  }

  const streams = Result.unwrap(manager).streams;
  const info = await attempt(() => streams.info(natsStreamName))();
  if (Result.isOk(info)) {
    const existingSubjects = Result.unwrap(info).config.subjects ?? [];
    const missingSubjects = natsStreamSubjects.filter(
      (subject) =>
        !existingSubjects.some((pattern) =>
          subjectPatternMatches(pattern, subject),
        ),
    );
    if (missingSubjects.length === 0) {
      return Result.ok(undefined);
    }

    const updated = await attempt(() =>
      streams.update(natsStreamName, {
        subjects: [...existingSubjects, ...missingSubjects],
      }),
    )();
    return Result.isErr(updated) ? updated : Result.ok(undefined);
  }

  const error = Result.unwrapErr(info);
  if (
    !(
      error instanceof JetStreamApiError &&
      error.code === JetStreamApiCodes.StreamNotFound
    )
  ) {
    return Result.err(error);
  }

  const created = await attempt(() =>
    streams.add({ name: natsStreamName, subjects: [...natsStreamSubjects] }),
  )();
  return Result.isErr(created) ? created : Result.ok(undefined);
}
