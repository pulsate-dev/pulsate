import { Option, Result } from 'mini-fn';
import { Account, AccountID, AccountRole } from '../model/account.ts';
import { AccountRepository } from '../model/repository.ts';
import { SnowflakeIDGenerator } from '../../id/mod.ts';
import { PasswordEncoder } from '../../password/mod.ts';
import { SendNotificationService } from './send_notification_service.ts';
import { TokenVerifyService } from './token_verify_service.ts';

export class AccountAlreadyExistsError extends Error {
  override readonly name = 'AccountAlreadyExistsError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class RegisterAccountService {
  private readonly accountRepository: AccountRepository;
  private readonly idGenerator: SnowflakeIDGenerator;
  private readonly passwordEncoder: PasswordEncoder;
  private readonly sendNotification: SendNotificationService;
  private readonly verifyTokenService: TokenVerifyService;

  constructor(arg: {
    repository: AccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    sendNotification: SendNotificationService;
    verifyTokenService: TokenVerifyService;
  }) {
    this.accountRepository = arg.repository;
    this.idGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.sendNotification = arg.sendNotification;
    this.verifyTokenService = arg.verifyTokenService;
  }

  public async handle(
    name: string,
    mail: string,
    nickname: string,
    passphrase: string,
    bio: string,
    role: AccountRole,
  ): Promise<Result.Result<Error, Account>> {
    // ToDo: verify with Captcha
    if (await this.isExists(mail, name)) {
      return Result.err(
        new AccountAlreadyExistsError('account already exists'),
      );
    }

    const passphraseHash = this.passwordEncoder.EncodePasword(passphrase);

    const generatedID = this.idGenerator.generate<AccountID>();
    if (Result.isErr(generatedID)) {
      return Result.err(generatedID[1]);
    }
    const account = Account.new({
      id: generatedID[1],
      name: name,
      mail: mail,
      nickname: nickname,
      passphraseHash: passphraseHash,
      bio: bio,
      role: role,
      frozen: 'normal',
      silenced: 'normal',
      status: 'notActivated',
      createdAt: new Date(),
    });
    const res = await this.accountRepository.Create(account);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    const token = await this.verifyTokenService.generate(account.getID);
    if (Result.isErr(token)) {
      return Result.err(token[1]);
    }

    // ToDo: Notification Body
    this.sendNotification.Send(mail, `token: ${token[1]}`);
    return Result.ok(account);
  }

  /**
   * @param mail account mail addr
   * @param name account name (e.g. "@me@example.com" )
   * @returns account is exist
   */
  private async isExists(mail: string, name: string): Promise<boolean> {
    const byName = await this.accountRepository.FindByName(name);
    const byMail = await this.accountRepository.FindByMail(mail);

    if (Option.isNone(byName) || Option.isNone(byMail)) {
      return true;
    }

    return false;
  }
}
