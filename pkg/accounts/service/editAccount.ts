import { Option, Result } from '@mikuroxina/mini-fn';

import { type PasswordEncoder } from '../../password/mod.js';
import type { AccountName } from '../model/account.js';
import { type AccountRepository } from '../model/repository.js';
import type { EtagVerifyService } from './etagGenerateVerify.js';

export class EditAccountService {
  private readonly nicknameShortest = 1;
  private readonly nicknameLongest = 256;
  private readonly passphraseShortest = 8;
  private readonly passphraseLongest = 512;
  private readonly emailShortest = 7;
  private readonly emailLongest = 319;

  private accountRepository: AccountRepository;
  private etagVerifyService: EtagVerifyService;
  private passwordEncoder: PasswordEncoder;

  constructor(
    accountRepository: AccountRepository,
    etagVerifyService: EtagVerifyService,
    passwordEncoder: PasswordEncoder,
  ) {
    this.accountRepository = accountRepository;
    this.etagVerifyService = etagVerifyService;
    this.passwordEncoder = passwordEncoder;
  }

  async editNickname(
    etag: string,
    name: AccountName,
    nickname: string,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);

    const match = await this.etagVerifyService.verify(account, etag);
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
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editPassphrase(
    etag: string,
    name: AccountName,
    newPassphrase: string,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);

    const match = await this.etagVerifyService.verify(account, etag);
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
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editEmail(
    etag: string,
    name: AccountName,
    newEmail: string,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);

    const match = await this.etagVerifyService.verify(account, etag);
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
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async editBio(etag: string, name: AccountName, bio: string) {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = Option.unwrap(res);

    const match = await this.etagVerifyService.verify(account, etag);
    if (!match) {
      return Result.err(new Error('etag not match'));
    }

    // ToDo(laminne): bio length check

    try {
      account.setBio(bio);
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
}
