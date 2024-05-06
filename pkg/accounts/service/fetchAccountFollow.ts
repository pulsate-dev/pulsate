import { Option, Cat, Result } from '@mikuroxina/mini-fn';

import type { AccountID, AccountName } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { AccountFollow } from '../model/follow.js';
import type {
  AccountFollowRepository,
  AccountRepository,
} from '../model/repository.js';

export class FetchAccountFollowService {
  constructor(
    private readonly accountFollowRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async fetchFollowingsByID(
    id: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowing(id);
  }

  async fetchFollowingsByName(
    name: AccountName,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const resId = Cat.cat(await this.accountRepository.findByName(name))
      .feed(Option.okOr(new Error('ACCOUNT_NOT_FOUND')))
      .feed(Result.map((a) => a.getID())).value;

    if (Result.isErr(resId)) {
      return resId;
    }

    return this.fetchFollowingsByID(resId[1]);
  }

  async fetchFollowersByID(
    id: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowers(id);
  }

  async fetchFollowersByName(
    name: AccountName,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const resId = Cat.cat(await this.accountRepository.findByName(name))
      .feed(Option.okOr(new Error('ACCOUNT_NOT_FOUND')))
      .feed(Result.map((a) => a.getID())).value;

    if (Result.isErr(resId)) {
      return resId;
    }

    return this.fetchFollowersByID(resId[1]);
  }
}
