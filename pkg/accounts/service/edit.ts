import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../password/mod.js';
import type { Account, AccountName } from '../model/account.js';
import {
  AccountMailAddressLengthError,
  AccountNicknameTooLongError,
  AccountNicknameTooShortError,
  AccountNotFoundError,
  AccountPassphraseRequirementsNotMetError,
} from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class EditService {
  private readonly nicknameShortest = 1;
  private readonly nicknameLongest = 256;
  private readonly passphraseShortest = 8;
  private readonly passphraseLongest = 512;
  private readonly emailShortest = 7;
  private readonly emailLongest = 319;

  constructor(
    private accountRepository: AccountRepository,
    private passwordEncoder: PasswordEncoder,
  ) {}

  async editNickname(
    target: AccountName,
    nickname: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(target);
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

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    if (nickname.length < this.nicknameShortest) {
      return Result.err(
        new AccountNicknameTooShortError('nickname too short', { cause: null }),
      );
    }
    if (nickname.length > this.nicknameLongest) {
      return Result.err(
        new AccountNicknameTooLongError('nickname too long', { cause: null }),
      );
    }

    const setNickNameRes = account.setNickName(nickname);
    if (Result.isErr(setNickNameRes)) {
      return setNickNameRes;
    }

    const editRes = await this.accountRepository.edit(account);
    if (Result.isErr(editRes)) {
      return editRes;
    }

    return Result.ok(true);
  }

  async editPassphrase(
    target: AccountName,
    newPassphrase: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(target);
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

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    if (newPassphrase.length < this.passphraseShortest) {
      return Result.err(
        new AccountPassphraseRequirementsNotMetError('passphrase too short', {
          cause: null,
        }),
      );
    }
    if (newPassphrase.length > this.passphraseLongest) {
      return Result.err(
        new AccountPassphraseRequirementsNotMetError('passphrase too long', {
          cause: null,
        }),
      );
    }

    const encodedPassphrase =
      await this.passwordEncoder.encodePassword(newPassphrase);
    const setPassphraseRes = account.setPassphraseHash(encodedPassphrase);
    if (Result.isErr(setPassphraseRes)) {
      return setPassphraseRes;
    }

    const editRes = await this.accountRepository.edit(account);
    if (Result.isErr(editRes)) {
      return editRes;
    }

    return Result.ok(true);
  }

  async editEmail(
    target: AccountName,
    newEmail: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(target);
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

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    if (newEmail.length < this.emailShortest) {
      return Result.err(
        new AccountMailAddressLengthError('email too short', { cause: null }),
      );
    }
    if (newEmail.length > this.emailLongest) {
      return Result.err(
        new AccountMailAddressLengthError('email too long', { cause: null }),
      );
    }

    // TODO: add a process to check the email is active

    const setMailRes = account.setMail(newEmail);
    if (Result.isErr(setMailRes)) {
      return setMailRes;
    }

    const editRes = await this.accountRepository.edit(account);
    if (Result.isErr(editRes)) {
      return editRes;
    }

    return Result.ok(true);
  }

  async editBio(
    target: AccountName,
    bio: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const accountRes = await this.accountRepository.findByName(target);
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

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    // ToDo(laminne): bio length check
    const setBioRes = account.setBio(bio);
    if (Result.isErr(setBioRes)) {
      return setBioRes;
    }

    const editRes = await this.accountRepository.edit(account);
    if (Result.isErr(editRes)) {
      return editRes;
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
        if (
          actor.getFrozen() === 'frozen' ||
          actor.getStatus() === 'notActivated'
        ) {
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
