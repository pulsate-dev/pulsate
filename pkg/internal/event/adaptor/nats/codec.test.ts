import { Result } from '@mikuroxina/mini-fn';
import type { JsMsg as JetStreamMessage } from '@nats-io/jetstream';
import { describe, expect, it, vi } from 'vitest';

import { decodeEvent } from './codec.ts';

const subject = 'note.created';
const event = {
  id: 'event-1',
  eventName: subject,
  target: 'note-1',
  actor: 'account-1',
  payload: { secret: 'do not log' },
  occurredAt: '2026-01-01T00:00:00.000Z',
};

const message = (value: unknown, receivedSubject = subject): JetStreamMessage =>
  ({
    subject: receivedSubject,
    data: new TextEncoder().encode(JSON.stringify(value)),
  }) as JetStreamMessage;

describe('decodeEvent', () => {
  it('revives timestamps and validates the decoded event payload', () => {
    const validatePayload = vi.fn(() => true);
    const decoded = Result.unwrap(
      decodeEvent(message(event), [subject], validatePayload),
    );

    expect(decoded).toEqual({
      ...event,
      occurredAt: new Date(event.occurredAt),
    });
    expect(validatePayload).toHaveBeenCalledWith(decoded);
  });

  it.each([
    { ...event, id: '' },
    { ...event, actor: undefined },
    { ...event, payload: ['invalid'] },
    { ...event, occurredAt: 'not-a-date' },
  ])('rejects an invalid event envelope', (invalid) => {
    expect(
      Result.unwrapErr(decodeEvent(message(invalid), [subject], () => true))
        .message,
    ).toBe('Invalid event envelope');
  });

  it('rejects unexpected subjects and invalid payloads', () => {
    expect(
      Result.unwrapErr(
        decodeEvent(message(event, 'note.renoted'), [subject], () => true),
      ).message,
    ).toBe('Unexpected event subject');
    expect(
      Result.unwrapErr(decodeEvent(message(event), [subject], () => false))
        .message,
    ).toBe('Invalid event payload');
  });

  it('does not reveal payload values in parser and validator errors', () => {
    const invalid = message(event);
    invalid.data = new TextEncoder().encode(
      '{"payload":"secret-must-not-leak"',
    );
    expect(
      Result.unwrapErr(decodeEvent(invalid, [subject], () => true)).message,
    ).toBe('Invalid event JSON');
    expect(
      Result.unwrapErr(
        decodeEvent(message(event), [subject], () => {
          throw new Error('secret-must-not-leak');
        }),
      ).message,
    ).toBe('Invalid event payload');
  });
});
