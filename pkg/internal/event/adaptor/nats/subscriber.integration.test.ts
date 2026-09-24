import { Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  EventSubscription,
  EventSubscriptionOptions,
} from '../../subscriber.ts';
import type { EventID } from '../../type.ts';
import { eventModuleLogger } from '../logger.ts';
import { NatsEventClient } from './client.ts';
import { NatsEventPublisher } from './publisher.ts';
import { NatsEventSubscriber } from './subscriber.ts';

const url = process.env.NATS_TEST_URL;
const clients: NatsEventClient[] = [];
const streams: string[] = [];
const subscriptions: EventSubscription[] = [];

async function subscribe(
  client: NatsEventClient,
  stream: string,
  options: EventSubscriptionOptions,
): Promise<EventSubscription> {
  return Result.unwrap(
    await new NatsEventSubscriber(client, stream).subscribe(options),
  );
}

async function setup() {
  const a = Result.unwrap(
    await NatsEventClient.connect({ servers: url ?? '' }),
  );
  const b = Result.unwrap(
    await NatsEventClient.connect({ servers: url ?? '' }),
  );
  clients.push(a, b);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  const stream = `EVENT_TEST_${suffix}`;
  const subjects: [string, string] = [
    `test${suffix}.created`,
    `test${suffix}.renoted`,
  ];
  await (await a.jetstream.jetstreamManager()).streams.add({
    name: stream,
    subjects,
  });
  streams.push(stream);
  const id = `timeline-push-${suffix}-v1`;
  return { a, b, stream, subjects, id };
}

function event(id: string, subject: string) {
  return {
    id: id as EventID,
    eventName: subject,
    target: 'note-1',
    actor: 'account-1',
    payload: { visibility: 'PUBLIC' },
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

async function until(predicate: () => boolean, timeout = 7000) {
  await vi.waitFor(() => expect(predicate()).toBe(true), {
    timeout,
    interval: 50,
  });
}

describe.skipIf(!url)(
  'JetStream durable pull subscriber (NATS_TEST_URL)',
  () => {
    afterEach(async () => {
      await Promise.all(
        subscriptions.splice(0).map((subscription) => subscription.stop()),
      );
      if (clients[0]) {
        const manager = await clients[0].jetstream.jetstreamManager();
        await Promise.all(
          streams.splice(0).map((stream) => manager.streams.delete(stream)),
        );
      }
      await Promise.all(clients.splice(0).map((client) => client.close()));
      vi.restoreAllMocks();
    });

    it('shares a durable across replicas and revives dates', async () => {
      const { a, b, stream, subjects, id } = await setup();
      const received: Array<{ replica: string; event: unknown }> = [];
      const options = {
        id,
        subjects,
        ackWaitMs: 10000,
        validatePayload: (e: { payload: unknown }) =>
          typeof e.payload === 'object' &&
          e.payload !== null &&
          'visibility' in e.payload,
      };
      subscriptions.push(
        await subscribe(a, stream, {
          ...options,
          handler: async (e) => {
            received.push({ replica: 'a', event: e });
            return Result.ok(undefined);
          },
        }),
      );
      subscriptions.push(
        await subscribe(b, stream, {
          ...options,
          handler: async (e) => {
            received.push({ replica: 'b', event: e });
            return Result.ok(undefined);
          },
        }),
      );

      const publisher = new NatsEventPublisher(a);
      await publisher.publishMany([
        event('first', subjects[0]),
        event('second', subjects[1]),
      ]);
      await until(() => received.length === 2);
      expect(
        received
          .map(({ event: e }) => (e as { eventName: string }).eventName)
          .sort(),
      ).toEqual([...subjects].sort());
      expect(
        received.every(
          ({ event: e }) =>
            (e as { occurredAt: unknown }).occurredAt instanceof Date,
        ),
      ).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(received).toHaveLength(2);
      expect(
        (
          await (
            await a.jetstream.jetstreamManager()
          ).consumers.info(stream, id)
        ).config.max_ack_pending,
      ).toBe(1);
    });

    it('retries failures and terminates the fifth delivery', async () => {
      const { a, stream, subjects, id } = await setup();
      const log = vi
        .spyOn(eventModuleLogger, 'error')
        .mockImplementation(() => undefined);
      const attempts: Date[] = [];
      subscriptions.push(
        await subscribe(a, stream, {
          id,
          subjects: [subjects[0]],
          ackWaitMs: 10000,
          validatePayload: () => true,
          handler: async () => {
            attempts.push(new Date());
            return Result.err(new Error('failed'));
          },
        }),
      );
      await new NatsEventPublisher(a).publishMany([event('fail', subjects[0])]);
      await until(() => attempts.length === 5, 21000);
      await until(() =>
        log.mock.calls.some(
          (call) => call[0] === 'Domain event delivery exhausted',
        ),
      );
      expect(log).toHaveBeenCalledWith(
        'Domain event delivery exhausted',
        expect.objectContaining({
          id: 'fail',
          subscriptionId: id,
          attempts: 5,
        }),
      );
      expect(
        (attempts[1]?.getTime() ?? 0) - (attempts[0]?.getTime() ?? 0),
      ).toBeGreaterThanOrEqual(800);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      expect(attempts).toHaveLength(5);
    }, 30000);

    it('rejects durable config conflicts without updating', async () => {
      const { a, b, stream, subjects, id } = await setup();
      const options = {
        id,
        subjects: [subjects[0]],
        ackWaitMs: 10000,
        validatePayload: () => true,
        handler: async () => Result.ok(undefined),
      };
      subscriptions.push(await subscribe(a, stream, options));
      const conflicting = await new NatsEventSubscriber(b, stream).subscribe({
        ...options,
        ackWaitMs: 20000,
      });
      expect(Result.unwrapErr(conflicting).message).toContain(
        'Consumer configuration mismatch',
      );
    });

    it('returns an error result when the stream is missing', async () => {
      const { a, stream, subjects, id } = await setup();
      const result = await new NatsEventSubscriber(
        a,
        `${stream}_MISSING`,
      ).subscribe({
        id,
        subjects: [subjects[0]],
        ackWaitMs: 10000,
        validatePayload: () => true,
        handler: async () => Result.ok(undefined),
      });
      expect(Result.isErr(result)).toBe(true);
    });

    it('retries handler exceptions before acknowledging success', async () => {
      const { a, stream, subjects, id } = await setup();
      const handler = vi
        .fn()
        .mockRejectedValueOnce(new Error('handler failed'))
        .mockResolvedValue(Result.ok(undefined));
      subscriptions.push(
        await subscribe(a, stream, {
          id,
          subjects: [subjects[0]],
          ackWaitMs: 10000,
          validatePayload: () => true,
          handler,
        }),
      );
      await new NatsEventPublisher(a).publishMany([
        event('retry', subjects[0]),
      ]);
      await until(() => handler.mock.calls.length === 2, 7000);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('converges on concurrent durable creation', async () => {
      const { a, b, stream, subjects, id } = await setup();
      const options = {
        id,
        subjects: [subjects[0]],
        ackWaitMs: 10000,
        validatePayload: () => true,
        handler: async () => Result.ok(undefined),
      };
      subscriptions.push(
        ...(await Promise.all([
          subscribe(a, stream, options),
          subscribe(b, stream, options),
        ])),
      );
      expect(
        (
          await (
            await a.jetstream.jetstreamManager()
          ).consumers.info(stream, id)
        ).config.durable_name,
      ).toBe(id);
    });

    it('limits in-flight work and waits for the active handler', async () => {
      const { a, b, stream, subjects, id } = await setup();
      const blocked = Promise.withResolvers<void>();
      const received: string[] = [];
      const options = {
        id,
        subjects: [subjects[0]],
        ackWaitMs: 10000,
        validatePayload: () => true,
      };
      const first = await subscribe(a, stream, {
        ...options,
        handler: async (e) => {
          received.push(e.id);
          await blocked.promise;
          return Result.ok(undefined);
        },
      });
      subscriptions.push(first);
      await new NatsEventPublisher(a).publishMany([event('one', subjects[0])]);
      await until(() => received.length === 1);
      const second = await subscribe(b, stream, {
        ...options,
        handler: async (e) => {
          received.push(e.id);
          await blocked.promise;
          return Result.ok(undefined);
        },
      });
      subscriptions.push(second);
      await new NatsEventPublisher(a).publishMany([event('two', subjects[0])]);
      try {
        await until(() => received.length === 1);
        await new Promise((resolve) => setTimeout(resolve, 350));
        expect(received).toHaveLength(1);
        expect(
          (
            await (
              await a.jetstream.jetstreamManager()
            ).consumers.info(stream, id)
          ).num_ack_pending,
        ).toBe(1);
        const stopped = vi.fn();
        const stopping = first.stop().then(stopped);
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(stopped).not.toHaveBeenCalled();
        blocked.resolve();
        await stopping;
        await until(() => received.length === 2);
      } finally {
        blocked.resolve();
      }
    });

    it('terminates invalid payloads without invoking the handler', async () => {
      const { a, stream, subjects, id } = await setup();
      const log = vi
        .spyOn(eventModuleLogger, 'error')
        .mockImplementation(() => undefined);
      const handler = vi.fn(async () => Result.ok(undefined));
      subscriptions.push(
        await subscribe(a, stream, {
          id,
          subjects: [subjects[0]],
          ackWaitMs: 10000,
          validatePayload: () => false,
          handler,
        }),
      );
      await new NatsEventPublisher(a).publishMany([
        event('invalid', subjects[0]),
      ]);
      await until(() =>
        log.mock.calls.some(
          (call) => call[0] === 'Invalid domain event; terminating delivery',
        ),
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('delivers an event to distinct logical handlers', async () => {
      const { a, b, stream, subjects, id } = await setup();
      const received: string[] = [];
      const options = {
        subjects: [subjects[0]],
        ackWaitMs: 10000,
        validatePayload: () => true,
      };
      subscriptions.push(
        await subscribe(a, stream, {
          ...options,
          id,
          handler: async () => {
            received.push('timeline');
            return Result.ok(undefined);
          },
        }),
      );
      subscriptions.push(
        await subscribe(b, stream, {
          ...options,
          id: `notification-push-${Date.now()}-v1`,
          handler: async () => {
            received.push('notification');
            return Result.ok(undefined);
          },
        }),
      );
      await new NatsEventPublisher(a).publishMany([event('both', subjects[0])]);
      await until(() => received.length === 2);
      expect(received.sort()).toEqual(['notification', 'timeline']);
    });
  },
);
