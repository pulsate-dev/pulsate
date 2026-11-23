import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { AccountAlreadyFollowingError } from '../../../model/errors.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../../../testData/testData.ts';
import { InMemoryAccountFollowRepository } from './follow.ts';

describe('InMemoryAccountFollowRepository uniqueness', () => {
  const from = generateDummyAccount();
  const to = generateDummyAccount();
  const newFollow = () =>
    generateDummyFollow({
      fromID: from.getID(),
      targetID: to.getID(),
    });

  it('rejects a distinct object with the same active account pair', async () => {
    const repository = new InMemoryAccountFollowRepository();
    Result.unwrap(await repository.follow(newFollow()));
    expect(
      Result.unwrapErr(await repository.follow(newFollow())),
    ).toBeInstanceOf(AccountAlreadyFollowingError);
    expect(
      Result.unwrap(await repository.fetchAllFollowing(from.getID())),
    ).toHaveLength(1);
  });

  it('unfollows by account pair rather than object identity', async () => {
    const repository = new InMemoryAccountFollowRepository([newFollow()]);
    Result.unwrap(await repository.unfollow(newFollow()));
    expect(
      Result.unwrap(await repository.hasActiveFollow(from.getID(), to.getID())),
    ).toBe(false);
  });

  it('replaces a deleted relationship without duplicating the pair', async () => {
    const old = generateDummyFollow({
      fromID: from.getID(),
      targetID: to.getID(),
      deletedAt: Option.some(new Date()),
    });
    const repository = new InMemoryAccountFollowRepository([old]);
    Result.unwrap(await repository.follow(newFollow()));
    expect(
      Result.unwrap(await repository.fetchAllFollowing(from.getID())),
    ).toHaveLength(1);
  });
});
