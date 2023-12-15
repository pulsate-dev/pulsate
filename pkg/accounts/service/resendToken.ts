import { Option, Result } from 'mini-fn';
import { AccountRepository } from '../model/repository.ts';
import { SendNotificationService } from './sendNotification.ts';
import { TokenVerifyService } from './tokenVerify.ts';

export class ResendVerifyTokenService {
  private readonly accountRepository: AccountRepository;
  private readonly tokenVerifyService: TokenVerifyService;
  private readonly sendNotificationService: SendNotificationService;

  constructor(
    accountRepository: AccountRepository,
    tokenVerifyService: TokenVerifyService,
    sendNotificationService: SendNotificationService,
  ) {
    this.accountRepository = accountRepository;
    this.tokenVerifyService = tokenVerifyService;
    this.sendNotificationService = sendNotificationService;
  }

  async handle(name: string): Promise<Option.Option<Error>> {
    const account = await this.accountRepository.findByName(name);
    if (Option.isNone(account)) {
      return Option.some(new Error('AccountNotFoundError'));
    }

    if (account[1].getStatus !== 'notActivated') {
      return Option.some(new Error('AccountAlreadyVerifiedError'));
    }

    const token = await this.tokenVerifyService.generate(account[1].getID);
    if (Result.isErr(token)) {
      return Option.some(token[1]);
    }

    this.sendNotificationService.Send(account[1].getMail, token[1]);

    return Option.none();
  }
}
