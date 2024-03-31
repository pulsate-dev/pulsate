import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import { type AccountRepository } from '../model/repository.js';
import { type SendNotificationService } from './sendNotification.js';
import type { VerifyTokenService } from './verifyToken.js';

export class ResendVerifyTokenService {
  private readonly accountRepository: AccountRepository;
  private readonly verifyTokenService: VerifyTokenService;
  private readonly sendNotificationService: SendNotificationService;

  constructor(
    accountRepository: AccountRepository,
    verifyTokenService: VerifyTokenService,
    sendNotificationService: SendNotificationService,
  ) {
    this.accountRepository = accountRepository;
    this.verifyTokenService = verifyTokenService;
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

    const token = await this.verifyTokenService.generate(account[1].getName());
    if (Result.isErr(token)) {
      return Option.some(token[1]);
    }

    await this.sendNotificationService.send(account[1].getMail(), token[1]);

    return Option.none();
  }
}
