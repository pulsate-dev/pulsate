import { Result } from '@mikuroxina/mini-fn';
import { hc } from 'hono/client';

import { type AccountModuleHandlerType } from '../accounts/mod.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountName,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../accounts/model/account.js';
import type { ID } from '../id/type.js';

export class AccountModule {
  // NOTE: This is a temporary solution to use hono client
  // ToDo: base url should be configurable
  private readonly client = hc<AccountModuleHandlerType>(
    'http://localhost:3000',
  );

  constructor() {}

  async fetchAccount(
    id: ID<AccountID>,
  ): Promise<Result.Result<Error, Account>> {
    const res = await this.client.accounts[':id'].$get({
      param: { id },
    });

    if (!res.ok) {
      return Result.err(new Error('Failed to fetch account'));
    }

    const body = await res.json();
    if ('error' in body) {
      return Result.err(new Error(body.error));
    }

    const account = Account.new({
      id: body.id as ID<AccountID>,
      mail: body.email as string,
      name: body.name as AccountName,
      nickname: body.nickname,
      bio: body.bio,
      role: body.role as AccountRole,
      frozen: body.frozen as AccountFrozen,
      silenced: body.silenced as AccountSilenced,
      status: body.status as AccountStatus,
      createdAt: body.created_at as Date,
      passphraseHash: undefined,
    });

    return Result.ok(account);
  }
}
