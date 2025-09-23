import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.js';
import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../password/mod.js';
import {
  Account,
  type AccountName,
  type AccountRole,
} from '../model/account.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';
import {
  type VerifyAccountTokenService,
  verifyAccountTokenSymbol,
} from './verifyToken.js';

export class AccountAlreadyExistsError extends Error {
  override readonly name = 'AccountAlreadyExistsError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class RegisterService {
  private readonly accountRepository: AccountRepository;
  private readonly snowflakeIDGenerator: SnowflakeIDGenerator;
  private readonly passwordEncoder: PasswordEncoder;
  private readonly notificationModule: NotificationModuleFacade;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly clock: Clock;

  constructor(arg: {
    repository: AccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    notificationModule: NotificationModuleFacade;
    verifyAccountTokenService: VerifyAccountTokenService;
    clock: Clock;
  }) {
    this.accountRepository = arg.repository;
    this.snowflakeIDGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.notificationModule = arg.notificationModule;
    this.verifyAccountTokenService = arg.verifyAccountTokenService;
    this.clock = arg.clock;
  }

  public async handle(
    name: AccountName,
    mail: string,
    nickname: string,
    passphrase: string,
    bio: string,
    role: AccountRole,
  ): Promise<Result.Result<Error, Account>> {
    if (await this.isExists(mail, name)) {
      return Result.err(
        new AccountAlreadyExistsError('account already exists'),
      );
    }
    const passphraseHash =
      await this.passwordEncoder.encodePassword(passphrase);
    const generatedIDRes = this.snowflakeIDGenerator.generate<Account>();
    if (Result.isErr(generatedIDRes)) {
      return generatedIDRes;
    }
    const generatedID = Result.unwrap(generatedIDRes);

    const now = this.clock.now();
    const account = Account.new({
      id: generatedID,
      name: name,
      mail: mail,
      nickname: nickname,
      passphraseHash: passphraseHash,
      bio: bio,
      role: role,
      frozen: 'normal',
      silenced: 'normal',
      status: 'notActivated',
      createdAt: new Date(Number(now)),
    });
    const res = await this.accountRepository.create(account);
    if (Result.isErr(res)) {
      return res;
    }

    const tokenRes = await this.verifyAccountTokenService.generate(
      account.getName(),
    );
    if (Result.isErr(tokenRes)) {
      return tokenRes;
    }
    const token = Result.unwrap(tokenRes);

    // ToDo: Notification Body
    await this.notificationModule.sendEmailNotification({
      to: mail,
      subject: 'Verify your email address',
      body: `token: ${token}`,
    });

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

export const registerSymbol = Ether.newEtherSymbol<RegisterService>();
export const register = Ether.newEther(
  registerSymbol,
  (deps) => new RegisterService(deps),
  {
    repository: accountRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    passwordEncoder: passwordEncoderSymbol,
    notificationModule: notificationModuleFacadeSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
    clock: clockSymbol,
  },
);
