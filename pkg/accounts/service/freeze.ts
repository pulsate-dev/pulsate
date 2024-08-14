import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountName } from '../model/account.js';
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
    const accountRes = await this.accountRepository.findByName(targetName);
    if (Option.isNone(accountRes)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(accountRes);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('freeze', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    try {
      account.setFreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async undoFreeze(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(targetName);
    if (Option.isNone(accountRes)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(accountRes);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('unFreeze', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    try {
      account.setUnfreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
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
        if (actor.getStatus() !== 'active' || actor.getFrozen() !== 'normal') {
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
        if (actor.getStatus() !== 'active' || actor.getFrozen() !== 'normal') {
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
