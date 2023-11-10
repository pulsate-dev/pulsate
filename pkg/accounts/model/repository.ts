import { Option, Result } from 'npm:@mikuroxina/mini-fn';
import { Account } from './account.ts';

export interface AccountRepository {
  Create(account: Account): Promise<Result.Result<Error, void>>;
  FindByName(name: string): Promise<Option.Option<Account>>;
  FindByMail(mail: string): Promise<Option.Option<Account>>;
}
