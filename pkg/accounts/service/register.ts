import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.js';
import {
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.js';
import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../internal/password/mod.js';
import {
  Account,
  type AccountName,
  type AccountRole,
} from '../model/account.js';
import { InactiveAccount } from '../model/inactiveAccount.js';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
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
  private readonly inactiveAccountRepository: InactiveAccountRepository;
  private readonly snowflakeIDGenerator: SnowflakeIDGenerator;
  private readonly passwordEncoder: PasswordEncoder;
  private readonly notificationModule: NotificationModuleFacade;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;

  constructor(arg: {
    repository: InactiveAccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    notificationModule: NotificationModuleFacade;
    verifyAccountTokenService: VerifyAccountTokenService;
  }) {
    this.inactiveAccountRepository = arg.repository;
    this.snowflakeIDGenerator = arg.idGenerator;
    this.passwordEncoder = arg.passwordEncoder;
    this.notificationModule = arg.notificationModule;
    this.verifyAccountTokenService = arg.verifyAccountTokenService;
  }

  public async handle(
    name: AccountName,
    mail: string,
    passphrase: string,
    role: AccountRole,
  ): Promise<Result.Result<Error, InactiveAccount>> {
    if (await this.isExists(mail, name)) {
      return Result.err(
        new AccountAlreadyExistsError('account already exists'),
      );
    }

    const validateResult = Account.validatePassphrase(passphrase);
    if (Result.isErr(validateResult)) {
      return validateResult;
    }

    const passphraseHash =
      await this.passwordEncoder.encodePassword(passphrase);
    const generatedIDRes = this.snowflakeIDGenerator.generate<Account>();
    if (Result.isErr(generatedIDRes)) {
      return generatedIDRes;
    }
    const generatedID = Result.unwrap(generatedIDRes);

    const accountRes = InactiveAccount.new({
      id: generatedID,
      name,
      mail,
      passphraseHash,
      role,
    });
    if (Result.isErr(accountRes)) {
      return accountRes;
    }
    const account = Result.unwrap(accountRes);

    const res = await this.inactiveAccountRepository.create(account);
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

  private async isExists(mail: string, name: string): Promise<boolean> {
    const byName = await this.inactiveAccountRepository.findByName(name);
    const byMail = await this.inactiveAccountRepository.findByMail(mail);

    return Option.isSome(byName) || Option.isSome(byMail);
  }
}

export const registerSymbol = Ether.newEtherSymbol<RegisterService>();
export const register = Ether.newEther(
  registerSymbol,
  (deps) => new RegisterService(deps),
  {
    repository: inactiveAccountRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    passwordEncoder: passwordEncoderSymbol,
    notificationModule: notificationModuleFacadeSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
  },
);
