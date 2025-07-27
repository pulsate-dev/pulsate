import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID, AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import type { AccountFollow } from '../model/follow.js';
import {
  type AccountFollowCount,
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  type FetchFollowerFilter,
  type FetchFollowingFilter,
  followRepoSymbol,
} from '../model/repository.js';

export class FetchFollowService {
  constructor(
    private readonly accountFollowRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async fetchFollowingsByID(
    id: AccountID,
    filter?: Option.Option<FetchFollowingFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowing(id, filter);
  }

  async fetchFollowingsByName(
    name: AccountName,
    filter?: Option.Option<FetchFollowingFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const resId = Cat.cat(await this.accountRepository.findByName(name))
      .feed(
        Option.okOr(
          new AccountNotFoundError('account not found', { cause: null }),
        ),
      )
      .feed(Result.map((a) => a.getID())).value;

    if (Result.isErr(resId)) {
      return resId;
    }

    return this.fetchFollowingsByID(Result.unwrap(resId), filter);
  }

  async fetchFollowersByID(
    id: AccountID,
    filter?: Option.Option<FetchFollowerFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowers(id, filter);
  }

  async fetchFollowersByName(
    name: AccountName,
    filter?: Option.Option<FetchFollowerFilter>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const resId = Cat.cat(await this.accountRepository.findByName(name))
      .feed(
        Option.okOr(
          new AccountNotFoundError('account not found', { cause: null }),
        ),
      )
      .feed(Result.map((a) => a.getID())).value;

    if (Result.isErr(resId)) {
      return resId;
    }

    return this.fetchFollowersByID(Result.unwrap(resId), filter);
  }

  async fetchFollowCount(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollowCount>> {
    return this.accountFollowRepository.followCount(accountID);
  }
}

export const fetchFollowSymbol = Ether.newEtherSymbol<FetchFollowService>();
export const fetchFollow = Ether.newEther(
  fetchFollowSymbol,
  ({ accountRepository, followRepository }) =>
    new FetchFollowService(followRepository, accountRepository),
  { followRepository: followRepoSymbol, accountRepository: accountRepoSymbol },
);
