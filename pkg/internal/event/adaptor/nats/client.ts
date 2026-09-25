import { Result } from '@mikuroxina/mini-fn';
import { type JetStreamClient, jetstream } from '@nats-io/jetstream';
import { connect, type NatsConnection } from '@nats-io/transport-node';

/**
 * Owns the transport; publishers and subscribers may share one connection.
 */
export class NatsEventClient {
  readonly #connection: NatsConnection;
  readonly jetstream: JetStreamClient;

  constructor(connection: NatsConnection) {
    this.#connection = connection;
    this.jetstream = jetstream(connection);
  }

  static async connect(
    options: Parameters<typeof connect>[0],
  ): Promise<Result.Result<Error, NatsEventClient>> {
    return Result.wrapAsyncThrowable((cause) =>
      cause instanceof Error ? cause : new Error(String(cause)),
    )(async () => new NatsEventClient(await connect(options)))();
  }

  /** Call after all subscriptions have stopped. */
  async close(): Promise<Result.Result<Error, void>> {
    return Result.wrapAsyncThrowable((cause) =>
      cause instanceof Error ? cause : new Error(String(cause)),
    )(() => this.#connection.drain())();
  }
}
