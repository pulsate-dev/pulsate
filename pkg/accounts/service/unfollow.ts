import { Option, Result } from '@mikuroxina/mini-fn';

import type { ID } from '../../id/type.js';
import type { AccountID } from '../model/account.js';
import type { AccountFollowRepository } from '../model/repository.js';

export class UnfollowService {
  constructor(private readonly followRepository: AccountFollowRepository) {
    this.followRepository = followRepository;
  }

  async handle(
    fromID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Option.Option<Error>> {
    const res = await this.followRepository.unfollow(fromID, targetID);
    if (Result.isErr(res)) {
      return Option.some(res[1]);
    }

    return Option.none();
  }
}
