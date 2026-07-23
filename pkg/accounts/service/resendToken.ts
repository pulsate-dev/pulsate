import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import type { AccountName } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
} from '../model/repository.ts';
import {
  type VerifyAccountTokenService,
  verifyAccountTokenSymbol,
} from './verifyToken.ts';

export class ResendVerifyTokenService {
  readonly #inactiveAccountRepository: InactiveAccountRepository;
  readonly #verifyAccountTokenService: VerifyAccountTokenService;
  readonly #notificationModule: NotificationModuleFacade;

  constructor(
    inactiveAccountRepository: InactiveAccountRepository,
    verifyAccountTokenService: VerifyAccountTokenService,
    notificationModule: NotificationModuleFacade,
  ) {
    this.#inactiveAccountRepository = inactiveAccountRepository;
    this.#verifyAccountTokenService = verifyAccountTokenService;
    this.#notificationModule = notificationModule;
  }

  async handle(name: AccountName): Promise<Option.Option<Error>> {
    const monad = resultPromiseMonad<Error>();

    const res = await Cat.doT(monad)
      .addM(
        'account',
        this.#inactiveAccountRepository
          .findByName(name)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addMWith('token', ({ account }) =>
        this.#verifyAccountTokenService.generate(account.getName()),
      )
      .runWith(({ account, token }) =>
        this.#notificationModule
          .sendEmailNotification({
            to: account.getMail(),
            subject: 'Verify your email address',
            body: `Please verify your email address using the following token: ${token}`,
          })
          .then(() => Result.ok([])),
      )
      .finish(() => undefined);

    return Result.optionErr(res);
  }
}

export const resendTokenSymbol =
  Ether.newEtherSymbol<ResendVerifyTokenService>();
export const resendToken = Ether.newEther(
  resendTokenSymbol,
  ({
    inactiveAccountRepository,
    verifyAccountTokenService,
    notificationModule,
  }) =>
    new ResendVerifyTokenService(
      inactiveAccountRepository,
      verifyAccountTokenService,
      notificationModule,
    ),
  {
    inactiveAccountRepository: inactiveAccountRepoSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
    notificationModule: notificationModuleFacadeSymbol,
  },
);
