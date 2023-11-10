import { Option, Result } from 'npm:@mikuroxina/mini-fn';
import { Account, AccountID } from '../model/account.ts';
import { AccountRepository } from '../model/repository.ts';
import { SnowflakeIDGenerator } from '../../id/mod.ts';
import { PasswordEncoder } from '../../password/mod.ts';
import { SendNotificationService } from './send_notification_service.ts';

export class AccountAlreadyExistsError extends Error {
  override readonly name = 'AccountAlreadyExistsError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class RegisterUserService {
  private readonly accountRepository: AccountRepository;
  private readonly idGenerator: SnowflakeIDGenerator;
  private readonly passwordEncoder: PasswordEncoder;
  private readonly sendNotification: SendNotificationService;

  constructor(arg: {
    repository: AccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    sendNotification: SendNotificationService;
  }) {
    this.accountRepository = arg.repository;
    this.idGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.sendNotification = arg.sendNotification;
  }

  public async handle(
    name: string,
    mail: string,
    nickname: string,
    passphrase: string,
    bio: string,
  ): Promise<Result.Result<Error, Account>> {
    /*
    1. captcha_token をそれ用の秘密鍵で検証します。
    2. アカウントのメールアドレスが mail_address またはアカウント名が account_name である登録済みアカウントまたは登録中のアカウントを検索します。 OK
      1. 存在すればエラー終了します。 OK
    3. ソルト (暗号学的乱数) として salt を生成します。 OK
    4. パスフレーズにソルトを結合し、ハッシュ passphrase_hash にします。 OK
    5. 検証チャレンジのステート (暗号学的乱数) として state を作成します。
    6. [登録中アカウント](https://www.notion.so/2030fb1f982c4c1fb3b1a4b350762ec4?pvs=21) をそれ専用のレポジトリに追加します。
    7. mail_address 宛に account_name と state が付いた検証メッセージを送信します。 OK
    */
    // ToDo: Captcha の検証
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
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'notActivated',
      createdAt: new Date(),
    });
    const res = await this.accountRepository.Create(account);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }
    this.sendNotification.Send(mail, "")
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
