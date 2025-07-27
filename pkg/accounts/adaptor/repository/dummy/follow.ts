import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../model/account.js';
import { AccountNotFoundError } from '../../../model/errors.js';
import type { AccountFollow } from '../../../model/follow.js';
import {
  type AccountFollowCount,
  type AccountFollowRepository,
  type FetchFollowerFilter,
  type FetchFollowingFilter,
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
    filter?: Option.Option<FetchFollowerFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getTargetID() === accountID);

    if (!filter || Option.isNone(filter)) {
      return Result.ok(res);
    }

    const filterValue = Option.unwrap(filter);

    // NOTE: both filters are false, equivalent to no filter
    if (!filterValue.onlyFollower && !filterValue.onlyFollowing) {
      return Result.ok(res);
    }

    const actorFollowers = this.getFollowerIds(filterValue.actorID);
    const actorFollowing = this.getFollowingIds(filterValue.actorID);

    const filtered = res.filter((f) => {
      const fromID = f.getFromID();

      if (filterValue.onlyFollower && filterValue.onlyFollowing) {
        // mutial follows
        return (
          actorFollowers.includes(fromID) && actorFollowing.includes(fromID)
        );
      }

      if (filterValue.onlyFollower) {
        return actorFollowers.includes(fromID);
      }

      if (filterValue.onlyFollowing) {
        return actorFollowing.includes(fromID);
      }

      return true;
    });

    return Result.ok(filtered);
  }

  async fetchAllFollowing(
    accountID: AccountID,
    filter?: Option.Option<FetchFollowingFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getFromID() === accountID);

    if (!filter || Option.isNone(filter)) {
      return Result.ok(res);
    }

    const filterValue = Option.unwrap(filter);

    // NOTE: both filters are false, equivalent to no filter
    if (!filterValue.onlyFollower && !filterValue.onlyFollowing) {
      return Result.ok(res);
    }

    const actorFollowers = this.getFollowerIds(filterValue.actorID);
    const actorFollowing = this.getFollowingIds(filterValue.actorID);

    const filtered = res.filter((f) => {
      const targetID = f.getTargetID();

      if (filterValue.onlyFollower && filterValue.onlyFollowing) {
        // mutual follows
        return (
          actorFollowers.includes(targetID) && actorFollowing.includes(targetID)
        );
      }

      if (filterValue.onlyFollower) {
        return actorFollowers.includes(targetID);
      }

      if (filterValue.onlyFollowing) {
        return actorFollowing.includes(targetID);
      }

      return true;
    });

    return Result.ok(filtered);
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

  async followCount(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollowCount>> {
    const count: AccountFollowCount = {
      followers: 0,
      following: 0,
    };

    for (const v of this.data) {
      if (v.getTargetID() === accountID) {
        count.followers += 1;
      }
      if (v.getFromID() === accountID) {
        count.following += 1;
      }
    }

    return Result.ok(count);
  }

  private getFollowerIds(actorID: AccountID): AccountID[] {
    return [...this.data]
      .filter((f) => f.getTargetID() === actorID)
      .map((f) => f.getFromID());
  }

  private getFollowingIds(actorID: AccountID): AccountID[] {
    return [...this.data]
      .filter((f) => f.getFromID() === actorID)
      .map((f) => f.getTargetID());
  }
}

export const newFollowRepo = (data?: AccountFollow[]) =>
  Ether.newEther(
    followRepoSymbol,
    () => new InMemoryAccountFollowRepository(data),
  );
