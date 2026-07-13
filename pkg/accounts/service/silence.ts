import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { Account, AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class SilenceService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setSilence(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('silence', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setSilence())),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async undoSilence(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('undoSilence', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.undoSilence())),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  private findAccount(
    name: AccountName,
    notFoundMessage: string,
  ): Promise<Result.Result<Error, Account>> {
    return this.accountRepository
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
  ({ accountRepository }) => new SilenceService(accountRepository),
  { accountRepository: accountRepoSymbol },
);
