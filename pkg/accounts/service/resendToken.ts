import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.js';
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
    const accountRes = await this.inactiveAccountRepository.findByName(name);
    if (Option.isNone(accountRes)) {
      return Option.some(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(accountRes);

    const tokenRes = await this.verifyAccountTokenService.generate(
      account.getName(),
    );
    if (Result.isErr(tokenRes)) {
      return Option.some(Result.unwrapErr(tokenRes));
    }
    const token = Result.unwrap(tokenRes);

    await this.notificationModule.sendEmailNotification({
      to: account.getMail(),
      subject: 'Verify your email address',
      body: `Please verify your email address using the following token: ${token}`,
    });

    return Option.none();
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
