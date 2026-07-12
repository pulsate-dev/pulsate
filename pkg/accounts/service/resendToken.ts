import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
} from '../model/repository.js';
import {
  type VerifyAccountTokenService,
  verifyAccountTokenSymbol,
} from './verifyToken.js';

export class ResendVerifyTokenService {
  private readonly inactiveAccountRepository: InactiveAccountRepository;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly notificationModule: NotificationModuleFacade;

  constructor(
    inactiveAccountRepository: InactiveAccountRepository,
    verifyAccountTokenService: VerifyAccountTokenService,
    notificationModule: NotificationModuleFacade,
  ) {
    this.inactiveAccountRepository = inactiveAccountRepository;
    this.verifyAccountTokenService = verifyAccountTokenService;
    this.notificationModule = notificationModule;
  }

  async handle(name: AccountName): Promise<Option.Option<Error>> {
    const monad = resultPromiseMonad<Error>();

    const res = await Cat.doT(monad)
      .addM(
        'account',
        this.inactiveAccountRepository
          .findByName(name)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addMWith('token', ({ account }) =>
        this.verifyAccountTokenService.generate(account.getName()),
      )
      .runWith(({ account, token }) =>
        this.notificationModule
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
