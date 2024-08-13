import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../password/mod.js';
import type { Account, AccountName } from '../model/account.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';
import { type EtagService, etagSymbol } from './etagService.js';

export class EditService {
  private readonly nicknameShortest = 1;
  private readonly nicknameLongest = 256;
  private readonly passphraseShortest = 8;
  private readonly passphraseLongest = 512;
  private readonly emailShortest = 7;
  private readonly emailLongest = 319;

  private accountRepository: AccountRepository;
  private etagService: EtagService;
  private passwordEncoder: PasswordEncoder;

  constructor(
    accountRepository: AccountRepository,
    etagService: EtagService,
    passwordEncoder: PasswordEncoder,
  ) {
    this.accountRepository = accountRepository;
    this.etagService = etagService;
    this.passwordEncoder = passwordEncoder;
  }

  async editNickname(
    etag: string,
    name: AccountName,
    nickname: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const match = await this.etagService.verify(account, etag);
    if (!match) {
      // TODO: add a new error type for etag not match
      return Result.err(new Error('etag not match'));
    }

    if (nickname.length < this.nicknameShortest) {
      return Result.err(new Error('nickname too short'));
    }
    if (nickname.length > this.nicknameLongest) {
      return Result.err(new Error('nickname too long'));
    }

    try {
      account.setNickName(nickname);
      const res = await this.accountRepository.edit(account);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editPassphrase(
    etag: string,
    name: AccountName,
    newPassphrase: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const match = await this.etagService.verify(account, etag);
    if (!match) {
      return Result.err(new Error('etag not match'));
    }

    if (newPassphrase.length < this.passphraseShortest) {
      return Result.err(new Error('passphrase too short'));
    }
    if (newPassphrase.length > this.passphraseLongest) {
      return Result.err(new Error('passphrase too long'));
    }

    try {
      account.setPassphraseHash(
        await this.passwordEncoder.encodePassword(newPassphrase),
      );

      const res = await this.accountRepository.edit(account);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editEmail(
    etag: string,
    name: AccountName,
    newEmail: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const match = await this.etagService.verify(account, etag);
    if (!match) {
      return Result.err(new Error('etag not match'));
    }

    if (newEmail.length < this.emailShortest) {
      return Result.err(new Error('email too short'));
    }
    if (newEmail.length > this.emailLongest) {
      return Result.err(new Error('email too long'));
    }

    // TODO: add a process to check the email is active

    try {
      account.setMail(newEmail);

      const res = await this.accountRepository.edit(account);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editBio(
    etag: string,
    name: AccountName,
    bio: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);
    const actorRes = await this.accountRepository.findByName(actorName);
    if (Option.isNone(actorRes)) {
      return Result.err(new Error('actor not found'));
    }
    const actor = Option.unwrap(actorRes);

    if (!this.isAllowed('edit', actor, account)) {
      return Result.err(new Error('not allowed'));
    }

    const match = await this.etagService.verify(account, etag);
    if (!match) {
      return Result.err(new Error('etag not match'));
    }

    // ToDo(laminne): bio length check

    try {
      account.setBio(bio);

      const res = await this.accountRepository.edit(account);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
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
  ({ accountRepository, etagService, passwordEncoder }) =>
    new EditService(accountRepository, etagService, passwordEncoder),
  {
    accountRepository: accountRepoSymbol,
    etagService: etagSymbol,
    passwordEncoder: passwordEncoderSymbol,
  },
);
