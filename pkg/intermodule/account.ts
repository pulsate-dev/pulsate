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
    const unwrapped = Result.unwrap(res);
    const account = Account.new({
      id: unwrapped.id as ID<AccountID>,
      mail: unwrapped.email,
      name: unwrapped.name as AccountName,
      nickname: unwrapped.nickname,
      bio: unwrapped.bio,
      role: unwrapped.role,
      frozen: unwrapped.frozen,
      silenced: unwrapped.silenced,
      status: unwrapped.status,
      createdAt: unwrapped.created_at,
      passphraseHash: undefined,
    });

    return Result.ok(account);
  }
}
