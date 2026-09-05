import { Cat, Ether, Option, Promise, type Result } from '@mikuroxina/mini-fn';

import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
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
  readonly #idGenerator: SnowflakeIDGenerator;
  constructor(
    followRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
    clock: Clock,
    idGenerator: SnowflakeIDGenerator,
  ) {
    this.#followRepository = followRepository;
    this.#accountRepository = accountRepository;
    this.#clock = clock;
    this.#idGenerator = idGenerator;
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
          AccountFollow.new(
            {
              fromID: fromAccount.getID(),
              targetID: targetAccount.getID(),
              createdAt: new Date(Number(this.#clock.now())),
            },
            {
              idGenerator: this.#idGenerator,
              actor: fromAccount.getID(),
              occurredAt: new Date(Number(this.#clock.now())),
            },
          ),
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
  ({ followRepository, accountRepository, clock, idGenerator }) =>
    new FollowService(followRepository, accountRepository, clock, idGenerator),
  {
    followRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
  },
);
