import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type NotificationModuleFacade,
  notificationModuleFacadeSymbol,
} from '../../intermodule/notification.js';
import type { AccountName } from '../model/account.js';
import {
  AccountMailAddressAlreadyVerifiedError,
  AccountNotFoundError,
} from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';
import {
  type VerifyAccountTokenService,
  verifyAccountTokenSymbol,
} from './verifyToken.js';

export class ResendVerifyTokenService {
  private readonly accountRepository: AccountRepository;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly notificationModule: NotificationModuleFacade;

  constructor(
    accountRepository: AccountRepository,
    verifyAccountTokenService: VerifyAccountTokenService,
    notificationModule: NotificationModuleFacade,
  ) {
    this.accountRepository = accountRepository;
    this.verifyAccountTokenService = verifyAccountTokenService;
    this.notificationModule = notificationModule;
  }

  async handle(name: AccountName): Promise<Option.Option<Error>> {
    const accountRes = await this.accountRepository.findByName(name);
    if (Option.isNone(accountRes)) {
      return Option.some(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(accountRes);

    if (account.getStatus() !== 'notActivated') {
      return Option.some(
        new AccountMailAddressAlreadyVerifiedError('account already verified', {
          cause: null,
        }),
      );
    }

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
  ({ accountRepository, verifyAccountTokenService, notificationModule }) =>
    new ResendVerifyTokenService(
      accountRepository,
      verifyAccountTokenService,
      notificationModule,
    ),
  {
    accountRepository: accountRepoSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
    notificationModule: notificationModuleFacadeSymbol,
  },
);
