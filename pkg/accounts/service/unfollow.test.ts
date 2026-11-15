import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../testData/testData.ts';
import { UnfollowService } from './unfollow.ts';

const follower = generateDummyAccount({ name: '@johndoe@example.com' });
const target = generateDummyAccount({ name: '@testuser@example.com' });
const accountRepository = new InMemoryAccountRepository([follower, target]);
const follow = generateDummyFollow({
  fromID: follower.getID(),
  targetID: target.getID(),
  createdAt: new Date('2023-09-10T00:00:00Z'),
});
const repository = new InMemoryAccountFollowRepository([follow]);
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const service = new UnfollowService(
  repository,
  accountRepository,
  new MockClock(new Date('2023-09-11T00:00:00Z')),
  eventPublisher,
);

describe('UnfollowService', () => {
  it('should unfollow', async () => {
    const res = await service.handle(
      '@johndoe@example.com',
      '@testuser@example.com',
    );

    expect(Option.isSome(res)).toBe(false);
    expect(follow.getDeletedAt()).toStrictEqual(
      Option.some(new Date('2023-09-11T00:00:00Z')),
    );
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.follow.unfollowed' }),
    ]);
  });
});
