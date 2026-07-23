import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.ts';
import {
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../internal/password/mod.ts';
import {
  Account,
  type AccountName,
  type AccountRole,
} from '../model/account.ts';
import { InactiveAccount } from '../model/inactiveAccount.ts';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
} from '../model/repository.ts';
import {
  type VerifyAccountTokenService,
  verifyAccountTokenSymbol,
} from './verifyToken.ts';

export class AccountAlreadyExistsError extends Error {
  override readonly name = 'AccountAlreadyExistsError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class RegisterService {
  readonly #inactiveAccountRepository: InactiveAccountRepository;
  readonly #snowflakeIDGenerator: SnowflakeIDGenerator;
  readonly #passwordEncoder: PasswordEncoder;
  readonly #notificationModule: NotificationModuleFacade;
  readonly #verifyAccountTokenService: VerifyAccountTokenService;

  constructor(arg: {
    repository: InactiveAccountRepository;
    idGenerator: SnowflakeIDGenerator;
    passwordEncoder: PasswordEncoder;
    notificationModule: NotificationModuleFacade;
    verifyAccountTokenService: VerifyAccountTokenService;
  }) {
    this.#inactiveAccountRepository = arg.repository;
    this.#snowflakeIDGenerator = arg.idGenerator;
    this.#passwordEncoder = arg.passwordEncoder;
    this.#notificationModule = arg.notificationModule;
    this.#verifyAccountTokenService = arg.verifyAccountTokenService;
  }

  public async handle(
    name: AccountName,
    mail: string,
    passphrase: string,
    role: AccountRole,
  ): Promise<Result.Result<Error, InactiveAccount>> {
    const monad = resultPromiseMonad<Error>();

    // ToDo: Notification Body
    return Cat.doT(monad)
      .addMWith('exists', () => this.isExists(mail, name).then(Result.ok))
      .when(
        ({ exists }) => exists,
        () =>
          Promise.resolve(
            Result.err(new AccountAlreadyExistsError('account already exists')),
          ),
      )
      .runWith(() =>
        monad.map(() => [])(
          Promise.resolve(Account.validatePassphrase(passphrase)),
        ),
      )
      .addMWith('passphraseHash', () =>
        this.#passwordEncoder.encodePassword(passphrase).then(Result.ok),
      )
      .addM(
        'generatedID',
        Promise.resolve(this.#snowflakeIDGenerator.generate<Account>()),
      )
      .addMWith('account', ({ generatedID, passphraseHash }) =>
        Promise.resolve(
          InactiveAccount.new({
            id: generatedID,
            name,
            mail,
            passphraseHash,
            role,
          }),
        ),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#inactiveAccountRepository.create(account)),
      )
      .addMWith('token', ({ account }) =>
        this.#verifyAccountTokenService.generate(account.getName()),
      )
      .runWith(({ token }) =>
        this.#notificationModule
          .sendEmailNotification({
            to: mail,
            subject: 'Verify your email address',
            body: `token: ${token}`,
          })
          .then(() => Result.ok([])),
      )
      .finish(({ account }) => account);
  }

  private async isExists(mail: string, name: string): Promise<boolean> {
    const byName = await this.#inactiveAccountRepository.findByName(name);
    const byMail = await this.#inactiveAccountRepository.findByMail(mail);

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
