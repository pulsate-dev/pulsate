import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  type SendEmailNotificationService,
  sendEmailNotificationSymbol,
} from '../../notification/service/sendEmailNotification.js';
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
  private readonly sendNotificationService: SendEmailNotificationService;

  constructor(
    accountRepository: AccountRepository,
    verifyAccountTokenService: VerifyAccountTokenService,
    sendNotificationService: SendEmailNotificationService,
  ) {
    this.accountRepository = accountRepository;
    this.verifyAccountTokenService = verifyAccountTokenService;
    this.sendNotificationService = sendNotificationService;
  }

  async handle(name: AccountName): Promise<Option.Option<Error>> {
    const account = await this.accountRepository.findByName(name);
    if (Option.isNone(account)) {
      return Option.some(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }

    if (account[1].getStatus() !== 'notActivated') {
      return Option.some(
        new AccountMailAddressAlreadyVerifiedError('account already verified', {
          cause: null,
        }),
      );
    }

    const token = await this.verifyAccountTokenService.generate(
      account[1].getName(),
    );
    if (Result.isErr(token)) {
      return Option.some(token[1]);
    }

    await this.sendNotificationService.send(account[1].getMail(), token[1]);

    return Option.none();
  }
}

export const resendTokenSymbol =
  Ether.newEtherSymbol<ResendVerifyTokenService>();
export const resendToken = Ether.newEther(
  resendTokenSymbol,
  ({ accountRepository, verifyAccountTokenService, sendNotificationService }) =>
    new ResendVerifyTokenService(
      accountRepository,
      verifyAccountTokenService,
      sendNotificationService,
    ),
  {
    accountRepository: accountRepoSymbol,
    verifyAccountTokenService: verifyAccountTokenSymbol,
    sendNotificationService: sendEmailNotificationSymbol,
  },
);
