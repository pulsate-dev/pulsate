import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../model/account.js';
import { AccountNotFoundError } from '../../../model/errors.js';
import type { AccountFollow } from '../../../model/follow.js';
import {
  type AccountFollowRepository,
  followRepoSymbol,
} from '../../../model/repository.js';

export class InMemoryAccountFollowRepository
  implements AccountFollowRepository
{
  private readonly data: Set<AccountFollow>;

  constructor(data?: AccountFollow[]) {
    this.data = new Set(data);
  }

  async fetchAllFollowers(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getTargetID() === accountID);
    return Result.ok(res);
  }

  async fetchAllFollowing(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getFromID() === accountID);
    return Result.ok(res);
  }

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    this.data.add(follow);
    return Result.ok(undefined);
  }

  async unfollow(
    accountID: AccountID,
    targetID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const follow = [...this.data].find(
      (f) => f.getFromID() === accountID && f.getTargetID() === targetID,
    );
    if (!follow) {
      return Result.err(new AccountNotFoundError('not found', { cause: null }));
    }

    this.data.delete(follow);
    return Result.ok(undefined);
  }

  async fetchOrderedFollowers(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return Result.ok(
      [...this.data]
        .filter((f) => f.getTargetID() === accountID)
        .sort((a, b) => {
          return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
        })
        .slice(0, limit),
    );
  }

  async fetchOrderedFollowing(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return Result.ok(
      [...this.data]
        .filter((f) => f.getFromID() === accountID)
        .sort((a, b) => {
          return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
        })
        .slice(0, limit),
    );
  }
}

export const newFollowRepo = (data?: AccountFollow[]) =>
  Ether.newEther(
    followRepoSymbol,
    () => new InMemoryAccountFollowRepository(data),
  );
