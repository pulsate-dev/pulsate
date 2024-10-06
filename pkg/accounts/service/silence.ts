import { Ether, Option, Result } from '@mikuroxina/mini-fn';

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
    const accountRes = await this.accountRepository.findByName(targetName);
    if (Option.isNone(accountRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(accountRes);

    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('silence', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    try {
      account.setSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async undoSilence(
    targetName: AccountName,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(targetName);
    if (Option.isNone(accountRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(accountRes);

    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('undoSilence', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    try {
      account.undoSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
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
        if (actor.getStatus() !== 'active' || actor.getFrozen() !== 'normal') {
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
        if (actor.getStatus() !== 'active' || actor.getFrozen() !== 'normal') {
          return false;
        }

        // NOTE: undoSilence action is allowed for only admin / moderator
        if (actor.getRole() !== 'admin' || actor.getRole() !== 'moderator') {
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
