import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID, AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import type { AccountFollow } from '../model/follow.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.js';

export class FetchFollowService {
  constructor(
    private readonly accountFollowRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async fetchFollowingsByID(
    id: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowing(id);
  }

  async fetchFollowingsByName(
    name: AccountName,
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

    return this.fetchFollowingsByID(resId[1]);
  }

  async fetchFollowersByID(
    id: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.accountFollowRepository.fetchAllFollowers(id);
  }

  async fetchFollowersByName(
    name: AccountName,
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

    return this.fetchFollowersByID(resId[1]);
  }
}

export const fetchFollowSymbol = Ether.newEtherSymbol<FetchFollowService>();
export const fetchFollow = Ether.newEther(
  fetchFollowSymbol,
  ({ accountRepository, followRepository }) =>
    new FetchFollowService(followRepository, accountRepository),
  { followRepository: followRepoSymbol, accountRepository: accountRepoSymbol },
);
