import { Cat, Ether, Option, type Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { AccountID, AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import type { AccountFollow } from '../model/follow.js';
import {
  type AccountFollowCount,
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.js';

export class FetchFollowService {
  readonly #accountFollowRepository: AccountFollowRepository;
  readonly #accountRepository: AccountRepository;
  constructor(
    accountFollowRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
  ) {
    this.#accountFollowRepository = accountFollowRepository;
    this.#accountRepository = accountRepository;
  }

  async fetchFollowingsByID(
    id: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.#accountFollowRepository.fetchAllFollowing(id);
  }

  async fetchFollowingsByName(
    name: AccountName,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'account',
        this.#accountRepository
          .findByName(name)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .finishM(({ account }) => this.fetchFollowingsByID(account.getID()));
  }

  async fetchFollowersByID(
    id: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return this.#accountFollowRepository.fetchAllFollowers(id);
  }

  async fetchFollowersByName(
    name: AccountName,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'account',
        this.#accountRepository
          .findByName(name)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .finishM(({ account }) => this.fetchFollowersByID(account.getID()));
  }

  async fetchFollowCount(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollowCount>> {
    return this.#accountFollowRepository.followCount(accountID);
  }
}

export const fetchFollowSymbol = Ether.newEtherSymbol<FetchFollowService>();
export const fetchFollow = Ether.newEther(
  fetchFollowSymbol,
  ({ accountRepository, followRepository }) =>
    new FetchFollowService(followRepository, accountRepository),
  { followRepository: followRepoSymbol, accountRepository: accountRepoSymbol },
);
