import { Option, Result } from 'mini-fn';
import { EtagVerifyService } from './etag_verify_generate_service.ts';
import { AccountRepository } from '../model/repository.ts';

export class EditNicknameService {
  private accountRepository: AccountRepository;
  private etagVerifyService: EtagVerifyService;

  constructor(
    accountRepository: AccountRepository,
    etagVerifyService: EtagVerifyService,
  ) {
    this.accountRepository = accountRepository;
    this.etagVerifyService = etagVerifyService;
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
    const account = res[1];

    const match = await this.etagVerifyService.Verify(account, etag);
    if (!match) {
      // TODO: add a new error type for etag not match
      return Result.err(new Error('etag not match'));
    }

    try {
      account.setNickName(nickname);
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }
}
