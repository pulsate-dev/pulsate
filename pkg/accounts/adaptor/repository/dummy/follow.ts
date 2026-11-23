import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../model/account.ts';
import { AccountAlreadyFollowingError } from '../../../model/errors.ts';
import type { AccountFollow } from '../../../model/follow.ts';
import {
  type AccountFollowCount,
  type AccountFollowRepository,
  followRepoSymbol,
} from '../../../model/repository.ts';

export class InMemoryAccountFollowRepository
  implements AccountFollowRepository
{
  readonly #data: Map<string, AccountFollow>;

  constructor(data: readonly AccountFollow[] = []) {
    this.#data = new Map(
      data.map((follow) => [
        this.#key(follow.getFromID(), follow.getTargetID()),
        follow,
      ]),
    );
  }

  #key(fromID: AccountID, targetID: AccountID): string {
    return JSON.stringify([fromID, targetID]);
  }

  async hasActiveFollow(
    fromID: AccountID,
    targetID: AccountID,
  ): Promise<Result.Result<Error, boolean>> {
    const follow = this.#data.get(this.#key(fromID, targetID));
    return Result.ok(
      follow !== undefined && Option.isNone(follow.getDeletedAt()),
    );
  }

  async fetchAllFollowers(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.#data.values()].filter(
      (f) => f.getTargetID() === accountID && Option.isNone(f.getDeletedAt()),
    );
    return Result.ok(res);
  }

  async fetchAllFollowing(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.#data.values()].filter(
      (f) => f.getFromID() === accountID && Option.isNone(f.getDeletedAt()),
    );
    return Result.ok(res);
  }

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    const key = this.#key(follow.getFromID(), follow.getTargetID());
    const existing = this.#data.get(key);
    if (existing && Option.isNone(existing.getDeletedAt())) {
      return Result.err(
        new AccountAlreadyFollowingError('Account is already following', {
          cause: null,
        }),
      );
    }
    this.#data.set(key, follow);
    return Result.ok(undefined);
  }

  async unfollow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    this.#data.delete(this.#key(follow.getFromID(), follow.getTargetID()));
    return Result.ok(undefined);
  }

  async fetchOrderedFollowers(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return Result.ok(
      [...this.#data.values()]
        .filter(
          (f) =>
            f.getTargetID() === accountID && Option.isNone(f.getDeletedAt()),
        )
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
      [...this.#data.values()]
        .filter(
          (f) => f.getFromID() === accountID && Option.isNone(f.getDeletedAt()),
        )
        .sort((a, b) => {
          return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
        })
        .slice(0, limit),
    );
  }

  async followCount(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollowCount>> {
    const count: AccountFollowCount = {
      followers: 0,
      following: 0,
    };

    for (const v of this.#data.values()) {
      if (Option.isSome(v.getDeletedAt())) continue;
      if (v.getTargetID() === accountID) {
        count.followers += 1;
      }
      if (v.getFromID() === accountID) {
        count.following += 1;
      }
    }

    return Result.ok(count);
  }
}

export const newFollowRepo = (data: readonly AccountFollow[] = []) => {
  const repository = new InMemoryAccountFollowRepository(data);
  return Ether.newEther(followRepoSymbol, () => repository);
};
