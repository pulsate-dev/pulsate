import type { Result } from '@mikuroxina/mini-fn';
import type {
  Account,
  AccountID,
  AccountName,
} from '../../accounts/model/account.js';

export interface PartialAccount {
  id: AccountID;
  name: AccountName;
  nickname: string;
  bio: string;
}

export interface AccountModuleFacade {
  fetchAccount(id: AccountID): Promise<Result.Result<Error, Account>>;
  fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>>;
  fetchFollowers(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>>;
}
