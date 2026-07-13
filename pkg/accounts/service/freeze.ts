import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { Account, AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class FreezeService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async setFreeze(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('freeze', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setFreeze())),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async undoFreeze(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(targetName, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('unFreeze', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setUnfreeze())),
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
    action: 'freeze' | 'unFreeze',
    actor: Account,
    resource: Account,
  ): boolean {
    switch (action) {
      case 'freeze':
        // NOTE: actor must be different from resource
        if (actor.getID() === resource.getID()) {
          return false;
        }

        // NOTE: actor must be active, not frozen
        if (!actor.isActivated() || actor.isFrozen()) {
          return false;
        }

        // NOTE: freeze action is allowed for only admin / moderator
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
      case 'unFreeze':
        // NOTE: actor must be different from resource
        if (actor.getID() === resource.getID()) {
          return false;
        }

        // NOTE: actor must be active, not frozen
        if (!actor.isActivated() || actor.isFrozen()) {
          return false;
        }

        // NOTE: unFreeze action is allowed for only admin / moderator
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

export const freezeSymbol = Ether.newEtherSymbol<FreezeService>();
export const freeze = Ether.newEther(
  freezeSymbol,
  ({ accountRepository }) => new FreezeService(accountRepository),
  { accountRepository: accountRepoSymbol },
);
