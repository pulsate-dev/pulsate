import { Ether, type Option, type Result } from '@mikuroxina/mini-fn';

import type { Account } from './account.js';
import type { AccountID } from './account.js';
import type { AccountFollow } from './follow.js';
import type { InactiveAccount } from './inactiveAccount.js';

export interface AccountRepository {
  create(account: Account): Promise<Result.Result<Error, void>>;
  findByName(name: string): Promise<Option.Option<Account>>;
  findByID(id: AccountID): Promise<Option.Option<Account>>;
  findManyByID(id: AccountID[]): Promise<Result.Result<Error, Account[]>>;
  findByMail(mail: string): Promise<Option.Option<Account>>;
  edit(account: Account): Promise<Result.Result<Error, void>>;
}
export const accountRepoSymbol = Ether.newEtherSymbol<AccountRepository>();

export interface InactiveAccountRepository {
  create(account: InactiveAccount): Promise<Result.Result<Error, void>>;
  findByName(name: string): Promise<Option.Option<InactiveAccount>>;
  findByMail(mail: string): Promise<Option.Option<InactiveAccount>>;
}
export const inactiveAccountRepoSymbol =
  Ether.newEtherSymbol<InactiveAccountRepository>();

export interface AccountVerifyTokenRepository {
  create(
    accountID: AccountID,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>>;
  // TODO(laminne): Consider create a type for token/expire
  findByID(
    id: AccountID,
  ): Promise<Option.Option<{ token: string; expire: Date }>>;
}
export const verifyTokenRepoSymbol =
  Ether.newEtherSymbol<AccountVerifyTokenRepository>();

export interface AccountFollowRepository {
  follow(follow: AccountFollow): Promise<Result.Result<Error, void>>;
  unfollow(
    fromID: AccountID,
    targetID: AccountID,
  ): Promise<Result.Result<Error, void>>;
  fetchAllFollowers(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>>;
  fetchAllFollowing(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>>;
  fetchOrderedFollowers(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>>;
  fetchOrderedFollowing(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>>;
}
export const followRepoSymbol = Ether.newEtherSymbol<AccountFollowRepository>();
