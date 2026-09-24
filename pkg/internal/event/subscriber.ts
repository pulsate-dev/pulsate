import type { Result } from '@mikuroxina/mini-fn';

import type { AnyDomainEvent } from './type.ts';

/** Handles a validated domain event and reports processing errors. */
export type EventHandler = (
  event: AnyDomainEvent,
) => Promise<Result.Result<Error, void>>;

/** Controls a running event subscription. */
export interface EventSubscription {
  /**
   * Stops fetching messages and waits for the current handler.
   */
  stop(): Promise<Result.Result<Error, void>>;
}

/** Configures a durable event subscription and its handler. */
export interface EventSubscriptionOptions {
  /** Stable ID shared by replicas of the same logical handler. */
  readonly id: string;
  readonly subjects: readonly string[];
  readonly handler: EventHandler;
  /** Rejects invalid event payloads before calling the handler. */
  readonly validatePayload: (event: AnyDomainEvent) => boolean;
  /**
   * Acknowledgement deadline in milliseconds. It must exceed the handler's
   * maximum execution time.
   */
  readonly ackWaitMs: number;
}

/** Starts event subscriptions for a configured event source. */
export interface EventSubscriber {
  /** Starts a subscription with the supplied options. */
  subscribe(
    options: EventSubscriptionOptions,
  ): Promise<Result.Result<Error, EventSubscription>>;
}
