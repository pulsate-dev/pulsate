import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import type {
  AccountFollowRepository,
  AccountRepository,
} from '../model/repository.js';

export class UnfollowService {
  constructor(
    private readonly followRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Option.Option<Error>> {
    const fromAccount = await this.accountRepository.findByName(from);
    if (Option.isNone(fromAccount)) {
      return Option.some(new Error('from account not found'));
    }
    const targetAccount = await this.accountRepository.findByName(target);
    if (Option.isNone(targetAccount)) {
      return Option.some(new Error('target account not found'));
    }

    const res = await this.followRepository.unfollow(
      fromAccount[1].getID,
      targetAccount[1].getID,
    );
    if (Result.isErr(res)) {
      return Option.some(res[1]);
    }

    return Option.none();
  }
}
