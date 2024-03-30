import { Result } from '@mikuroxina/mini-fn';

import type { Account } from '../../model/account.js';

export const serializeAccount = (
  omits: string[],
  account: Account,
): Result.Result<Error, unknown> => {
  const base: Record<string, unknown> = {
    id: account.getID(),
    name: account.getName(),
    created_at: account.getCreatedAt(),
    mail: account.getMail(),
    nickname: account.getNickname(),
    passphrase_hash: account.getPassphraseHash(), // FIXME: 除外すべき？
    bio: account.getBio(),
    role: account.getRole(), // FIXME: 除外すべき？
    frozen: account.getFrozen(),
    silenced: account.getSilenced(),
    status: account.getStatus(),
    updated_at: account.getUpdatedAt(),
    deleted_at: account.getDeletedAt(),
  };

  for (const key of omits) {
    delete base[key];
  }

  return Result.ok(base);
};
