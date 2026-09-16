import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import { type Clock, clockSymbol } from '../../internal/id/mod.ts';
import type { AccountName } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import { AccountFollow } from '../model/follow.ts';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.ts';

export class FollowService {
  readonly #followRepository: AccountFollowRepository;
  readonly #accountRepository: AccountRepository;
  readonly #clock: Clock;
  readonly #eventPublisher: EventPublisher;
  constructor(
    followRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
    clock: Clock,
    eventPublisher: EventPublisher,
  ) {
    this.#followRepository = followRepository;
    this.#accountRepository = accountRepository;
    this.#clock = clock;
    this.#eventPublisher = eventPublisher;
  }

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Result.Result<Error, AccountFollow>> {
    const monad = Promise.resultMonad<Error>();

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
      .addMWith('follow', ({ fromAccount, targetAccount }) =>
        Promise.resolve(
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
      .runWith(({ follow }) => {
        this.#eventPublisher.publishMany(follow.pullEvents());
        return monad.map(() => [])(Promise.resolve(Result.ok(undefined)));
      })
      .finish(({ follow }) => follow);
  }
}

export const followSymbol = Ether.newEtherSymbol<FollowService>();
export const follow = Ether.newEther(
  followSymbol,
  ({ followRepository, accountRepository, clock, eventPublisher }) =>
    new FollowService(
      followRepository,
      accountRepository,
      clock,
      eventPublisher,
    ),
  {
    followRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
