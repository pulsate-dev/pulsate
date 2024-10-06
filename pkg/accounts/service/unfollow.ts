import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
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
      return Option.some(
        new AccountNotFoundError('from account not found', { cause: null }),
      );
    }
    const targetAccount = await this.accountRepository.findByName(target);
    if (Option.isNone(targetAccount)) {
      return Option.some(
        new AccountNotFoundError('target account not found', { cause: null }),
      );
    }

    const res = await this.followRepository.unfollow(
      fromAccount[1].getID(),
      targetAccount[1].getID(),
    );
    if (Result.isErr(res)) {
      return Option.some(res[1]);
    }

    return Option.none();
  }
}

export const unfollowSymbol = Ether.newEtherSymbol<UnfollowService>();
export const unfollow = Ether.newEther(
  unfollowSymbol,
  ({ accountFollowRepository, accountRepository }) =>
    new UnfollowService(accountFollowRepository, accountRepository),
  {
    accountFollowRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
  },
);
