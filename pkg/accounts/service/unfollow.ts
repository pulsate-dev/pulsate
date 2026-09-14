import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../internal/id/mod.ts';
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
  ): Promise<Option.Option<Error>> {
    const monad = Promise.resultMonad<Error>();

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
      .addMWith('allFollows', ({ fromAccount }) =>
        this.#followRepository.fetchAllFollowing(fromAccount.getID()),
      )
      .addMWith('follow', async ({ allFollows, targetAccount }) => {
        const follow = allFollows.find(
          (item) => item.getTargetID() === targetAccount.getID(),
        );
        return follow
          ? Result.ok(follow)
          : Result.err(
              new AccountNotFoundError('follow not found', {
                cause: null,
              }),
            );
      })
      .runWith(({ follow }) =>
        Promise.resolve(
          follow.delete(new Date(Number(this.#clock.now()))),
        ).then(Result.map(() => [])),
      )
      .runWith(({ follow }) =>
        monad.map(() => [])(this.#followRepository.unfollow(follow)),
      )
      .finish(() => []);

    return Result.optionErr(res);
  }
}

export const unfollowSymbol = Ether.newEtherSymbol<UnfollowService>();
export const unfollow = Ether.newEther(
  unfollowSymbol,
  ({ accountFollowRepository, accountRepository, clock }) =>
    new UnfollowService(accountFollowRepository, accountRepository, clock),
  {
    accountFollowRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
  },
);
