import { Option, Result } from '@mikuroxina/mini-fn';
import { Account, type AccountID } from './account.js';
import { type ID } from '../../id/type.js';

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
