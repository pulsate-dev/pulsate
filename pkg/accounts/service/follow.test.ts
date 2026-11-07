import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import { generateDummyAccount } from '../testData/testData.ts';
import { FollowService } from './follow.ts';

const follower = generateDummyAccount({ name: '@johndoe@example.com' });
const target = generateDummyAccount({ name: '@testuser@example.com' });
const accountRepository = new InMemoryAccountRepository([follower, target]);
const repository = new InMemoryAccountFollowRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const service = new FollowService(
  repository,
  accountRepository,
  mockClock,
  eventPublisher,
);

describe('FollowService', () => {
  it('should follow', async () => {
    const res = await service.handle(
      '@johndoe@example.com',
      '@testuser@example.com',
    );

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(res).getFromID()).toBe(follower.getID());
    expect(Result.unwrap(res).getTargetID()).toBe(target.getID());
    expect(Result.unwrap(res).getDeletedAt()).toStrictEqual(Option.none());
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.follow.requested' }),
      expect.objectContaining({ eventName: 'account.follow.accepted' }),
    ]);
  });
});
