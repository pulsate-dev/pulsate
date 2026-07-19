import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../internal/id/mod.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { AccountFollow } from '../model/follow.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.js';

export class FollowService {
  readonly #followRepository: AccountFollowRepository;
  readonly #accountRepository: AccountRepository;
  readonly #clock: Clock;
  constructor(
    followRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
    clock: Clock,
  ) {
    this.#followRepository = followRepository;
    this.#accountRepository = accountRepository;
    this.#clock = clock;
  }

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Result.Result<Error, AccountFollow>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'fromAccount',
        this.#accountRepository
          .findByName(from)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addM(
        'targetAccount',
        this.#accountRepository
          .findByName(target)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addWith('follow', ({ fromAccount, targetAccount }) =>
        Result.unwrap(
          AccountFollow.new({
            fromID: fromAccount.getID(),
            targetID: targetAccount.getID(),
            createdAt: new Date(Number(this.#clock.now())),
          }),
        ),
      )
      .runWith(({ follow }) =>
        monad.map(() => [])(this.#followRepository.follow(follow)),
      )
      .finish(({ follow }) => follow);
  }
}

export const followSymbol = Ether.newEtherSymbol<FollowService>();
export const follow = Ether.newEther(
  followSymbol,
  ({ followRepository, accountRepository, clock }) =>
    new FollowService(followRepository, accountRepository, clock),
  {
    followRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
  },
);
