import { Result } from '@mikuroxina/mini-fn';
import {
  AckPolicy,
  type ConsumerConfig,
  DeliverPolicy,
  ReplayPolicy,
} from '@nats-io/jetstream';
import { nanos } from '@nats-io/transport-node';
import * as v from 'valibot';

import type { EventSubscriptionOptions } from '../../subscriber.ts';

export const maxDeliver = 5;

const subscriptionSchema = v.object({
  id: v.pipe(
    v.string(),
    v.regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-v[1-9][0-9]*$/),
  ),
  subjects: v.pipe(
    v.array(v.pipe(v.string(), v.nonEmpty(), v.regex(/^[^*>\s]+$/))),
    v.nonEmpty(),
    v.check((subjects) => new Set(subjects).size === subjects.length),
  ),
  ackWaitMs: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(1000),
    v.check((value) => Number.isSafeInteger(value)),
  ),
  validatePayload: v.custom((value) => typeof value === 'function'),
});

export function validateSubscription(
  options: EventSubscriptionOptions,
): Result.Result<Error, void> {
  return v.safeParse(subscriptionSchema, options).success
    ? Result.ok(undefined)
    : Result.err(new Error('Invalid event subscription options'));
}

export function createConsumerConfig(
  options: EventSubscriptionOptions,
): ConsumerConfig {
  return {
    durable_name: options.id,
    ack_policy: AckPolicy.Explicit,
    deliver_policy: DeliverPolicy.All,
    replay_policy: ReplayPolicy.Instant,
    ...(options.subjects.length === 1
      ? { filter_subject: options.subjects[0] }
      : { filter_subjects: [...options.subjects].sort() }),
    max_ack_pending: 1,
    max_deliver: maxDeliver,
    ack_wait: nanos(options.ackWaitMs),
  };
}

export function checkConsumerConfig(
  actual: ConsumerConfig,
  options: EventSubscriptionOptions,
): Result.Result<Error, void> {
  const subjects =
    actual.filter_subjects ??
    (actual.filter_subject ? [actual.filter_subject] : []);
  const expectedSubjects = [...options.subjects].sort();
  const schema = v.object({
    durable_name: v.literal(options.id),
    ack_policy: v.literal(AckPolicy.Explicit),
    deliver_policy: v.literal(DeliverPolicy.All),
    replay_policy: v.literal(ReplayPolicy.Instant),
    max_ack_pending: v.literal(1),
    max_deliver: v.literal(maxDeliver),
    ack_wait: v.literal(nanos(options.ackWaitMs)),
    deliver_subject: v.optional(v.undefined()),
    backoff: v.optional(v.pipe(v.array(v.number()), v.maxLength(0))),
    subjects: v.pipe(
      v.array(v.string()),
      v.check(
        (value) =>
          JSON.stringify([...value].sort()) ===
          JSON.stringify(expectedSubjects),
      ),
    ),
  });
  return v.safeParse(schema, { ...actual, subjects }).success
    ? Result.ok(undefined)
    : Result.err(new Error(`Consumer configuration mismatch: ${options.id}`));
}
