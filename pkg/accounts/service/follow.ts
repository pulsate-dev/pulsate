import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import { AccountFollow } from '../model/follow.js';
import {
  accountRepoSymbol,
  followRepoSymbol,
  type AccountFollowRepository,
  type AccountRepository,
} from '../model/repository.js';

export class FollowService {
  constructor(
    private readonly followRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Result.Result<Error, AccountFollow>> {
    const fromAccount = await this.accountRepository.findByName(from);
    if (Option.isNone(fromAccount)) {
      return Result.err(new Error('from account not found'));
    }
    const targetAccount = await this.accountRepository.findByName(target);
    if (Option.isNone(targetAccount)) {
      return Result.err(new Error('target account not found'));
    }

    const follow = AccountFollow.new({
      fromID: fromAccount[1].getID(),
      targetID: targetAccount[1].getID(),
      createdAt: new Date(),
    });

    const res = await this.followRepository.follow(follow);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(follow);
  }
}

export const followSymbol = Ether.newEtherSymbol<FollowService>();
export const follow = Ether.newEther(
  followSymbol,
  ({ followRepository, accountRepository }) =>
    new FollowService(followRepository, accountRepository),
  { followRepository: followRepoSymbol, accountRepository: accountRepoSymbol },
);
