import { Result } from '@mikuroxina/mini-fn';
import type { JsMsg as JetStreamMessage } from '@nats-io/jetstream';
import * as v from 'valibot';

import type { AnyDomainEvent, EventID } from '../../type.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

const eventSchema = v.object({
  id: v.pipe(
    v.string(),
    v.nonEmpty(),
    v.transform((id) => id as EventID),
  ),
  eventName: v.pipe(v.string(), v.nonEmpty()),
  target: v.string(),
  actor: v.unknown(),
  payload: v.pipe(
    v.unknown(),
    v.check((value) => !Array.isArray(value)),
    v.looseObject({}),
  ),
  occurredAt: v.pipe(
    v.string(),
    v.isoTimestamp(),
    v.transform((value) => new Date(value)),
  ),
});

export function encodeEvent(event: AnyDomainEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event));
}

const checkPayload = Result.wrapThrowable(
  () => new Error('Invalid event payload'),
)((validate: (event: AnyDomainEvent) => boolean, event: AnyDomainEvent) =>
  validate(event),
);

export function decodeEvent(
  message: JetStreamMessage,
  subjects: readonly string[],
  validatePayload: (event: AnyDomainEvent) => boolean,
): Result.Result<Error, AnyDomainEvent> {
  const json = Result.wrapThrowable(() => new Error('Invalid event JSON'))(
    (data: Uint8Array): unknown => JSON.parse(decoder.decode(data)),
  )(message.data);
  if (Result.isErr(json)) {
    return json;
  }

  const parsed = v.safeParse(eventSchema, Result.unwrap(json));
  if (!parsed.success) {
    return Result.err(new Error('Invalid event envelope'));
  }

  const event = parsed.output;
  if (
    event.eventName !== message.subject ||
    !subjects.includes(event.eventName)
  ) {
    return Result.err(new Error('Unexpected event subject'));
  }
  // Discard validator errors, which may include payload values.
  const valid = checkPayload(validatePayload, event);
  return Result.isOk(valid) && Result.unwrap(valid)
    ? Result.ok(event)
    : Result.err(new Error('Invalid event payload'));
}
