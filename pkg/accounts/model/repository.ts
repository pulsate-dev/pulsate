import { Option, Result } from 'mini-fn';
import { Account, AccountID } from './account.ts';
import { ID } from '../../id/type.ts';

export interface AccountRepository {
  Create(account: Account): Promise<Result.Result<Error, void>>;
  FindByName(name: string): Promise<Option.Option<Account>>;
  FindByMail(mail: string): Promise<Option.Option<Account>>;
}

export interface AccountVerifyTokenRepository {
  Create(
    accountID: ID<AccountID>,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>>;
  // TODO(laminne): Consider create a type for token/expire
  FindByID(
    id: ID<AccountID>,
  ): Promise<Option.Option<{ token: string; expire: Date }>>;
}
