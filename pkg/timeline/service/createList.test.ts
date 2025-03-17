import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { MockClock, SnowflakeIDGenerator } from '../../id/mod.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { CreateListService } from './createList.js';

describe('CreateListService', () => {
  const repository = new InMemoryListRepository();
  const service = new CreateListService(
    new SnowflakeIDGenerator(0, {
      now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
    }),
    repository,
    new MockClock(new Date('2023-09-10T00:00:00Z')),
  );

  it('should create a list', async () => {
    const res = await service.handle('Hello world', true, '1' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    const unwrapped = Result.unwrap(res);
    expect(unwrapped.getTitle()).toBe('Hello world');
    expect(unwrapped.isPublic()).toBe(true);
    expect(unwrapped.getOwnerId()).toBe('1');
  });
});
