import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../testData/testData.ts';
import { FetchFollowService } from './fetchFollow.ts';

const user = generateDummyAccount({ name: '@johndoe@example.com' });
const other = generateDummyAccount({ name: '@testuser@example.com' });
const accountRepository = new InMemoryAccountRepository([user, other]);

const following = generateDummyFollow({
  fromID: user.getID(),
  targetID: other.getID(),
});
const follower = generateDummyFollow({
  fromID: other.getID(),
  targetID: user.getID(),
});
const repository = new InMemoryAccountFollowRepository();
await repository.follow(following);
await repository.follow(follower);

const service = new FetchFollowService(repository, accountRepository);

describe('FetchFollowService', () => {
  it('fetch followings by id', async () => {
    const resFollows = await service.fetchFollowingsByID(user.getID());
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([following]);
  });

  it('fetch followings by name', async () => {
    const resFollows = await service.fetchFollowingsByName(user.getName());
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([following]);
  });

  it('fetch followers by id', async () => {
    const resFollows = await service.fetchFollowersByID(user.getID());
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([follower]);
  });

  it('fetch followers by name', async () => {
    const resFollows = await service.fetchFollowersByName(user.getName());
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([follower]);
  });

  it('follow count', async () => {
    const countRes = await service.fetchFollowCount(user.getID());

    expect(Result.unwrap(countRes)).toStrictEqual({
      followers: 1,
      following: 1,
    });
  });
});
