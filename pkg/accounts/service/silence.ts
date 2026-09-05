import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import type { Account, AccountName } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.ts';

export class SilenceService {
  readonly #accountRepository: AccountRepository;
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #clock: Clock;

  constructor(
    accountRepository: AccountRepository,
    idGenerator: SnowflakeIDGenerator,
    clock: Clock,
  ) {
    this.#accountRepository = accountRepository;
    this.#idGenerator = idGenerator;
    this.#clock = clock;
  }

  async setSilence(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('silence', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account, actor }) =>
        monad.map(() => [])(
          Promise.resolve(
            account.setSilence({
              idGenerator: this.#idGenerator,
              actor: actor.getID(),
              occurredAt: new Date(Number(this.#clock.now())),
            }),
          ),
        ),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async undoSilence(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('undoSilence', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account, actor }) =>
        monad.map(() => [])(
          Promise.resolve(
            account.undoSilence({
              idGenerator: this.#idGenerator,
              actor: actor.getID(),
              occurredAt: new Date(Number(this.#clock.now())),
            }),
          ),
        ),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  private findAccount(
    name: AccountName,
    notFoundMessage: string,
  ): Promise<Result.Result<Error, Account>> {
    return this.#accountRepository
      .findByName(name)
      .then(
        Option.okOr(new AccountNotFoundError(notFoundMessage, { cause: null })),
      );
  }

  private isAllowed(
    action: 'silence' | 'undoSilence',
    actor: Account,
    resource: Account,
  ): boolean {
    switch (action) {
      case 'silence':
        // NOTE: actor must be different from resource
        if (actor.getID() === resource.getID()) {
          return false;
        }

        // NOTE: actor must be active, not frozen
        if (!actor.isActivated() || actor.isFrozen()) {
          return false;
        }

        // NOTE: silence action is allowed for only admin / moderator
        if (actor.getRole() !== 'admin' && actor.getRole() !== 'moderator') {
          return false;
        }

        // NOTE: if actor.role is moderator, resource.role must be normal
        if (
          actor.getRole() === 'moderator' &&
          resource.getRole() !== 'normal'
        ) {
          return false;
        }

        return true;
      case 'undoSilence':
        // NOTE: actor must be different from resource
        if (actor.getID() === resource.getID()) {
          return false;
        }

        // NOTE: actor must be active, not frozen
        if (!actor.isActivated() || actor.isFrozen()) {
          return false;
        }

        // NOTE: undoSilence action is allowed for only admin / moderator
        if (actor.getRole() !== 'admin' && actor.getRole() !== 'moderator') {
          return false;
        }

        // NOTE: if actor.role is moderator, resource.role must be normal
        if (
          actor.getRole() === 'moderator' &&
          resource.getRole() !== 'normal'
        ) {
          return false;
        }

        return true;
      default:
        return false;
    }
  }
}

export const silenceSymbol = Ether.newEtherSymbol<SilenceService>();
export const silence = Ether.newEther(
  silenceSymbol,
  ({ accountRepository, idGenerator, clock }) =>
    new SilenceService(accountRepository, idGenerator, clock),
  {
    accountRepository: accountRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    clock: clockSymbol,
  },
);
