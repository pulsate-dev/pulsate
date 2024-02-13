import { Result } from '@mikuroxina/mini-fn';

import type { ID } from '../../id/type.js';
import type { AccountID } from '../model/account.js';
import { AccountFollow } from '../model/follow.js';
import type { AccountFollowRepository } from '../model/repository.js';

export class FollowService {
  constructor(private readonly followRepository: AccountFollowRepository) {
    this.followRepository = followRepository;
  }

  async handle(
    fromID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow>> {
    const follow = AccountFollow.new({
      fromID: fromID,
      targetID: targetID,
      createdAt: new Date(),
    });

    const res = await this.followRepository.follow(follow);
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(follow);
  }
}
