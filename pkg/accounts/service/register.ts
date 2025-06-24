import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
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
  type SendNotificationService,
  sendNotificationSymbol,
} from './sendNotification.js';
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
  private readonly sendNotificationService: SendNotificationService;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly clock: Clock;

  constructor(arg: {
    repository: AccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    sendNotification: SendNotificationService;
    verifyAccountTokenService: VerifyAccountTokenService;
    clock: Clock;
  }) {
    this.accountRepository = arg.repository;
    this.snowflakeIDGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.sendNotificationService = arg.sendNotification;
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
    const generatedID = this.snowflakeIDGenerator.generate<Account>();
    if (Result.isErr(generatedID)) {
      return Result.err(generatedID[1]);
    }
    const now = this.clock.now();
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
      createdAt: new Date(Number(now)),
    });
    const res = await this.accountRepository.create(account);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    const token = await this.verifyAccountTokenService.generate(
      account.getName(),
    );
    if (Result.isErr(token)) {
      return Result.err(token[1]);
    }

    // ToDo: Notification Body
    await this.sendNotificationService.send(mail, `token: ${token[1]}`);

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
    sendNotification: sendNotificationSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
    clock: clockSymbol,
  },
);
