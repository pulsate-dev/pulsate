import { Option, Result } from 'mini-fn';
import { Account, AccountID, AccountRole } from '../model/account.ts';
import { AccountRepository } from '../model/repository.ts';
import { SnowflakeIDGenerator } from '../../id/mod.ts';
import { PasswordEncoder } from '../../password/mod.ts';
import { SendNotificationService } from './sendNotification.ts';
import { TokenVerifyService } from './tokenVerify.ts';

export class AccountAlreadyExistsError extends Error {
  override readonly name = 'AccountAlreadyExistsError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class RegisterAccountService {
  private readonly accountRepository: AccountRepository;
  private readonly snowflakeIDGenerator: SnowflakeIDGenerator;
  private readonly passwordEncoder: PasswordEncoder;
  private readonly sendNotificationService: SendNotificationService;
  private readonly tokenVerifyService: TokenVerifyService;

  constructor(arg: {
    repository: AccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    sendNotification: SendNotificationService;
    verifyTokenService: TokenVerifyService;
  }) {
    this.accountRepository = arg.repository;
    this.snowflakeIDGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.sendNotificationService = arg.sendNotification;
    this.tokenVerifyService = arg.verifyTokenService;
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

    const generatedID = this.snowflakeIDGenerator.generate<AccountID>();
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
    const res = await this.accountRepository.create(account);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    const token = await this.tokenVerifyService.generate(account.getID);
    if (Result.isErr(token)) {
      return Result.err(token[1]);
    }

    // ToDo: Notification Body
    this.sendNotificationService.Send(mail, `token: ${token[1]}`);
    return Result.ok(account);
  }

  /**
   * @param mail account mail addr
   * @param name account name (e.g. "@me@example.com" )
   * @returns account is exist
   */
  private async isExists(mail: string, name: string): Promise<boolean> {
    const byName = await this.accountRepository.findByName(name);
    const byMail = await this.accountRepository.findByMail(mail);

    return Option.isSome(byName) || Option.isSome(byMail);
  }
}
