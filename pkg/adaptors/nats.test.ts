import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import type { NatsEventClient } from '../internal/event/adaptor/nats/client.ts';
import {
  ensureNatsStream,
  natsStreamName,
  natsStreamSubjects,
} from './nats.ts';

describe('ensureNatsStream', () => {
  it('adds missing event subjects while preserving existing subjects', async () => {
    const update = vi.fn(async () => ({}));
    const client = {
      jetstream: {
        jetstreamManager: async () => ({
          streams: {
            info: async () => ({ config: { subjects: ['custom.event'] } }),
            update,
          },
        }),
      },
    } as unknown as NatsEventClient;

    const result = await ensureNatsStream(client);

    expect(Result.isOk(result)).toBe(true);
    expect(update).toHaveBeenCalledWith(natsStreamName, {
      subjects: ['custom.event', ...natsStreamSubjects],
    });
  });

  it('does not update a stream whose wildcard subjects already cover events', async () => {
    const update = vi.fn(async () => ({}));
    const client = {
      jetstream: {
        jetstreamManager: async () => ({
          streams: {
            info: async () => ({ config: { subjects: ['>'] } }),
            update,
          },
        }),
      },
    } as unknown as NatsEventClient;

    const result = await ensureNatsStream(client);

    expect(Result.isOk(result)).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
});
