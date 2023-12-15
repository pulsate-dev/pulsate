import { Option, Result } from 'mini-fn';
import { EtagVerifyService } from './etagGenerateVerify.ts';
import { AccountRepository } from '../model/repository.ts';
import { PasswordEncoder } from '../../password/mod.ts';

const nicknameShortest = 1;
const nicknameLongest = 256;

export class EditAccountService {
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
    name: string,
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

    if (nickname.length < nicknameShortest) {
      return Result.err(new Error('nickname too short'));
    }
    if (nickname.length > nicknameLongest) {
      return Result.err(new Error('nickname too long'));
    }

    try {
      account.setNickName(nickname);
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }

  async editPassphrase(
    etag: string,
    name: string,
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

    try {
      account.setPassphraseHash(
        this.passwordEncoder.EncodePasword(newPassphrase),
      );
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }

  async editEmail(
    etag: string,
    name: string,
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

    // TODO: add a process to check the email is active

    try {
      account.setMail(newEmail);
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }
}
