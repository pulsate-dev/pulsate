import { Result } from '@mikuroxina/mini-fn';

import type { AccountController } from '../accounts/adaptor/controller/account.js';
import {
  Account,
  type AccountID,
  type AccountName,
} from '../accounts/model/account.js';
import type { ID } from '../id/type.js';

export class AccountModule {
  constructor(private readonly controller: AccountController) {}

  async fetchAccount(
    name: AccountName,
  ): Promise<Result.Result<Error, Account>> {
    const res = await this.controller.getAccount(name);

    if (Result.isErr(res)) {
      return res;
    }

    const account = Account.new({
      id: Result.unwrap(res).id as ID<AccountID>,
      mail: Result.unwrap(res).email,
      name: Result.unwrap(res).name as AccountName,
      nickname: Result.unwrap(res).nickname,
      bio: Result.unwrap(res).bio,
      role: Result.unwrap(res).role,
      frozen: Result.unwrap(res).frozen,
      silenced: Result.unwrap(res).silenced,
      status: Result.unwrap(res).status,
      createdAt: Result.unwrap(res).created_at,
      passphraseHash: undefined,
    });

    return Result.ok(account);
  }
}
