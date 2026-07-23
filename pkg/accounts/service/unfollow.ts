import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import type { AccountName } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.ts';

export class UnfollowService {
  readonly #followRepository: AccountFollowRepository;
  readonly #accountRepository: AccountRepository;
  constructor(
    followRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
  ) {
    this.#followRepository = followRepository;
    this.#accountRepository = accountRepository;
  }

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Option.Option<Error>> {
    const monad = resultPromiseMonad<Error>();

    const res = await Cat.doT(monad)
      .addM(
        'fromAccount',
        this.#accountRepository.findByName(from).then(
          Option.okOr(
            new AccountNotFoundError('from account not found', {
              cause: null,
            }),
          ),
        ),
      )
      .addM(
        'targetAccount',
        this.#accountRepository.findByName(target).then(
          Option.okOr(
            new AccountNotFoundError('target account not found', {
              cause: null,
            }),
          ),
        ),
      )
      .finishM(({ fromAccount, targetAccount }) =>
        this.#followRepository.unfollow(
          fromAccount.getID(),
          targetAccount.getID(),
        ),
      );

    return Result.optionErr(res);
  }
}

export const unfollowSymbol = Ether.newEtherSymbol<UnfollowService>();
export const unfollow = Ether.newEther(
  unfollowSymbol,
  ({ accountFollowRepository, accountRepository }) =>
    new UnfollowService(accountFollowRepository, accountRepository),
  {
    accountFollowRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
  },
);
