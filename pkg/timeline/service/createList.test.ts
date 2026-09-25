import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { CreateListService } from './createList.ts';

describe('CreateListService', () => {
  const repository = new InMemoryListRepository();
  const eventPublisher = {
    publishMany: vi.fn(async () => undefined),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new CreateListService(
    new SnowflakeIDGenerator(0, {
      now: () => BigInt(new Date('2023-10-10T00:00:00Z').getTime()),
    }),
    repository,
    new MockClock(new Date('2023-09-10T00:00:00Z')),
    eventPublisher,
  );

  it('should create a list', async () => {
    const res = await service.handle('Hello world', true, '1' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    const unwrapped = Result.unwrap(res);
    expect(unwrapped.getTitle()).toBe('Hello world');
    expect(unwrapped.isPublic()).toBe(true);
    expect(unwrapped.getOwnerId()).toBe('1');
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.created' }),
    ]);
  });
});
