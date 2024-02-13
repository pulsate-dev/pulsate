import { Option, Result } from '@mikuroxina/mini-fn';

import { type ID } from '../../../id/type.js';
import { type Account, type AccountID } from '../../model/account.js';
import { type AccountFollow } from '../../model/follow.js';
import type {
  AccountFollowRepository,
  AccountRepository,
  AccountVerifyTokenRepository,
} from '../../model/repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private data: Set<Account>;
  constructor() {
    this.data = new Set();
  }
  create(account: Account): Promise<Result.Result<Error, void>> {
    this.data.add(account);
    return Promise.resolve(Result.ok(undefined));
  }

  reset(): void {
    this.data.clear();
  }

  findByName(name: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getName === name);
    if (!account) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(account));
  }

  findByMail(mail: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getMail === mail);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }
}

export class InMemoryAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  private data: Map<string, { token: string; expire: Date }>;
  constructor() {
    this.data = new Map();
  }

  create(
    accountID: ID<AccountID>,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(accountID.toString(), { token, expire });
    return Promise.resolve(Result.ok(undefined));
  }

  findByID(
    id: ID<string>,
  ): Promise<Option.Option<{ token: string; expire: Date }>> {
    const data = this.data.get(id);
    if (!data) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(data));
  }
}

export class InMemoryAccountFollowRepository
  implements AccountFollowRepository
{
  private readonly data: Set<AccountFollow>;
  constructor(data?: AccountFollow[]) {
    this.data = new Set(data);
  }

  async fetchFollowers(
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getTargetID() === accountID);
    return Result.ok(res);
  }

  async fetchFollowing(
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getFromID() === accountID);
    return Result.ok(res);
  }

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    this.data.add(follow);
    return Result.ok(undefined);
  }

  async unfollow(
    accountID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Result.Result<Error, void>> {
    const follow = [...this.data].find(
      (f) => f.getFromID() === accountID && f.getTargetID() === targetID,
    );
    if (!follow) {
      return Result.err(new Error('Not found'));
    }

    this.data.delete(follow);
    return Result.ok(undefined);
  }
}
