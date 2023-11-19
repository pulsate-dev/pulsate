import { AccountRepository } from '../model/repository.ts';
import { EtagVerifyService } from './etag_verify_generate_service.ts';
import { PasswordEncoder } from '../../password/mod.ts';
import { Option, Result } from 'mini-fn';

export class EditPassphraseService {
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

  async editPassphrase(
    etag: string,
    name: string,
    oldPassphrase: string,
    newPassphrase: string,
  ): Promise<Result.Result<Error, boolean>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('account not found'));
    }
    const account = res[1];

    const match = await this.etagVerifyService.Verify(account, etag);
    if (!match) {
      return Result.err(new Error('etag not match'));
    }

    const oldPassphraseHash = account.getPassphraseHash;
    if (!oldPassphraseHash) {
      return Result.err(new Error('failed to match passphrase'));
    }
    if (
      !this.passwordEncoder.IsMatchPassword(oldPassphrase, oldPassphraseHash)
    ) {
      return Result.err(new Error('failed to match passphrase'));
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
}
