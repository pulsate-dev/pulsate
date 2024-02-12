import type { Option, Result } from '@mikuroxina/mini-fn';

import { type ID } from '../../id/type.js';
import type { Account } from './account.js';
import { type AccountID } from './account.js';

export interface AccountRepository {
  create(account: Account): Promise<Result.Result<Error, void>>;
  findByName(name: string): Promise<Option.Option<Account>>;
  findByMail(mail: string): Promise<Option.Option<Account>>;
}

export interface AccountVerifyTokenRepository {
  create(
    accountID: ID<AccountID>,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>>;
  // TODO(laminne): Consider create a type for token/expire
  findByID(
    id: ID<AccountID>,
  ): Promise<Option.Option<{ token: string; expire: Date }>>;
}

export interface AccountFollowRepository {
  follow(
    accountID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Result.Result<Error, void>>;
  unfollow(
    accountID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Result.Result<Error, void>>;
  isFollowing(
    accountID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<boolean>;
  fetchFollowers(accountID: ID<AccountID>): Promise<Account[]>;
  fetchFollowing(accountID: ID<AccountID>): Promise<Account[]>;
}
