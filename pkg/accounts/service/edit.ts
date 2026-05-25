import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../internal/password/mod.js';
import { Account, type AccountName } from '../model/account.js';
import { AccountInternalError, AccountNotFoundError } from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class EditService {
  constructor(
    private accountRepository: AccountRepository,
    private passwordEncoder: PasswordEncoder,
  ) {}

  async editNickname(
    target: AccountName,
    nickname: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(target);
    if (Option.isNone(res)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const setResult = account.setNickName(nickname);
    if (Result.isErr(setResult)) {
      return setResult;
    }
    const editResult = await this.accountRepository.edit(account);
    if (Result.isErr(editResult)) {
      return editResult;
    }
    return Result.ok(true);
  }

  async editPassphrase(
    target: AccountName,
    newPassphrase: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(target);
    if (Option.isNone(res)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const validateResult = Account.validatePassphrase(newPassphrase);
    if (Result.isErr(validateResult)) {
      return validateResult;
    }

    let encoded: string;
    try {
      encoded = await this.passwordEncoder.encodePassword(newPassphrase);
    } catch (e) {
      return Result.err(
        new AccountInternalError('failed to encode passphrase', { cause: e }),
      );
    }

    const setResult = account.setPassphraseHash(encoded);
    if (Result.isErr(setResult)) {
      return setResult;
    }
    const editResult = await this.accountRepository.edit(account);
    if (Result.isErr(editResult)) {
      return editResult;
    }
    return Result.ok(true);
  }

  async editEmail(
    target: AccountName,
    newEmail: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(target);
    if (Option.isNone(res)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    // TODO: add a process to check the email is active

    const setResult = account.setMail(newEmail);
    if (Result.isErr(setResult)) {
      return setResult;
    }
    const editResult = await this.accountRepository.edit(account);
    if (Result.isErr(editResult)) {
      return editResult;
    }
    return Result.ok(true);
  }

  async editBio(
    target: AccountName,
    bio: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(target);
    if (Option.isNone(res)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(
        new AccountNotFoundError('actor not found', { cause: null }),
      );
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const setResult = account.setBio(bio);
    if (Result.isErr(setResult)) {
      return setResult;
    }
    const editResult = await this.accountRepository.edit(account);
    if (Result.isErr(editResult)) {
      return editResult;
    }
    return Result.ok(true);
  }

  private isAllowed(
    action: 'edit',
    actor: Account,
    resource: Account,
  ): boolean {
    switch (action) {
      case 'edit':
        // NOTE: Frozen account or notActivated account can't edit account information
        if (actor.isFrozen() || !actor.isActivated()) {
          return false;
        }

        // NOTE: Account can't edit other account information
        return actor.getID() === resource.getID();
      default:
        return false;
    }
  }
}

export const editSymbol = Ether.newEtherSymbol<EditService>();
export const edit = Ether.newEther(
  editSymbol,
  ({ accountRepository, passwordEncoder }) =>
    new EditService(accountRepository, passwordEncoder),
  {
    accountRepository: accountRepoSymbol,
    passwordEncoder: passwordEncoderSymbol,
  },
);
