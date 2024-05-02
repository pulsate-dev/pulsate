import { Option, Result } from '@mikuroxina/mini-fn';
import type { AccountName } from '~/accounts/model/account.js';
import { type AccountRepository } from '~/accounts/model/repository.js';

import { type SendNotificationService } from './sendNotification.js';
import type { VerifyAccountTokenService } from './verifyToken.js';

export class ResendVerifyTokenService {
  private readonly accountRepository: AccountRepository;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly sendNotificationService: SendNotificationService;

  constructor(
    accountRepository: AccountRepository,
    verifyAccountTokenService: VerifyAccountTokenService,
    sendNotificationService: SendNotificationService,
  ) {
    this.accountRepository = accountRepository;
    this.verifyAccountTokenService = verifyAccountTokenService;
    this.sendNotificationService = sendNotificationService;
  }

  async handle(name: AccountName): Promise<Option.Option<Error>> {
    const account = await this.accountRepository.findByName(name);
    if (Option.isNone(account)) {
      return Option.some(new Error('AccountNotFoundError'));
    }

    if (account[1].getStatus() !== 'notActivated') {
      return Option.some(new Error('AccountAlreadyVerifiedError'));
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
