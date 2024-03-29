import { Option } from '@mikuroxina/mini-fn';

import type { AccountID, AccountName } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type {
  AccountFollowRepository,
  AccountRepository,
} from '../model/repository.js';

export class FetchAccountFollowService {
  constructor(
    private readonly accountFollowRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async fetchFollowsByID(id: ID<AccountID>) /* inferred */ {
    return this.accountFollowRepository.fetchAllFollowers(id);
  }

  async fetchFollowsByName(name: AccountName) /* inferred */ {
    const id = await this.accountRepository
      .findByName(name)
      .then((o) => Option.unwrap(o))
      .then((a) => a.getID());

    return this.fetchFollowsByID(id);
  }

  async fetchFollowersByID(id: ID<AccountID>) /* inferred */ {
    return this.accountFollowRepository.fetchAllFollowing(id);
  }

  async fetchFollowersByName(name: AccountName) /* inferred */ {
    const id = await this.accountRepository
      .findByName(name)
      .then((o) => Option.unwrap(o))
      .then((a) => a.getID());

    return this.fetchFollowersByID(id);
  }
}
