import { Result } from '@mikuroxina/mini-fn';
import { hc } from 'hono/client';

import type { AccountModuleHandlerType } from '../accounts/mod.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountName,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../accounts/model/account.js';

export interface PartialAccount {
  id: AccountID;
  name: AccountName;
  nickname: string;
  bio: string;
}

export class AccountModule {
  // NOTE: This is a temporary solution to use hono client
  // ToDo: base url should be configurable
  private readonly client = hc<AccountModuleHandlerType>(
    'http://localhost:3000',
  );

  async fetchAccount(id: AccountID): Promise<Result.Result<Error, Account>> {
    const res = await this.client.accounts[':id'].$get({
      param: { id },
    });

    if (!res.ok) {
      return Result.err(new Error('Failed to fetch account'));
    }

    const body = await res.json();
    if ('error' in body) {
      return Result.err(new Error((body as { error: string }).error));
    }

    const account = Account.new({
      id: body.id as AccountID,
      mail: body.email as string,
      name: body.name as AccountName,
      nickname: body.nickname,
      bio: body.bio,
      role: body.role as AccountRole,
      frozen: body.frozen as AccountFrozen,
      silenced: body.silenced as AccountSilenced,
      status: body.status as AccountStatus,
      createdAt: new Date(body.created_at!),
      passphraseHash: undefined,
    });

    return Result.ok(account);
  }

  async fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const res = await this.client.accounts[':id'].following.$get({
      param: { id },
    });
    if (!res.ok) {
      return Result.err(new Error('Failed to fetch followings'));
    }

    const body = await res.json();
    if ('error' in body) {
      return Result.err(new Error((body as { error: string }).error));
    }
    return Result.ok(
      body.map((v): PartialAccount => {
        return {
          id: v.id as AccountID,
          name: v.name as AccountName,
          nickname: v.nickname,
          bio: v.bio,
        };
      }),
    );
  }

  async fetchFollowers(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const res = await this.client.accounts[':id'].follower.$get({
      param: { id },
    });
    if (!res.ok) {
      return Result.err(new Error('Failed to fetch followers'));
    }

    const body = await res.json();
    if ('error' in body) {
      return Result.err(new Error((body as { error: string }).error));
    }
    return Result.ok(
      body.map((v): PartialAccount => {
        return {
          id: v.id as AccountID,
          name: v.name as AccountName,
          nickname: v.nickname,
          bio: v.bio,
        };
      }),
    );
  }
}
