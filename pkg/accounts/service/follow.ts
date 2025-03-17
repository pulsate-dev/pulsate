import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../id/mod.js';
import type { AccountName } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { AccountFollow } from '../model/follow.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.js';

export class FollowService {
  constructor(
    private readonly followRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
    private readonly clock: Clock,
  ) {}

  async handle(
    from: AccountName,
    target: AccountName,
  ): Promise<Result.Result<Error, AccountFollow>> {
    const fromAccount = await this.accountRepository.findByName(from);
    if (Option.isNone(fromAccount)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const targetAccount = await this.accountRepository.findByName(target);
    if (Option.isNone(targetAccount)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }

    const now = this.clock.now();
    const follow = AccountFollow.new({
      fromID: fromAccount[1].getID(),
      targetID: targetAccount[1].getID(),
      createdAt: new Date(Number(now)),
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
  ({ followRepository, accountRepository, clock }) =>
    new FollowService(followRepository, accountRepository, clock),
  {
    followRepository: followRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
  },
);
