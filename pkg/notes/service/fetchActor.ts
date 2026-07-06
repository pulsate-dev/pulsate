import { Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.js';
import { AccountNotFoundError } from '../../accounts/model/errors.js';
import type { AccountModuleFacade } from '../../intermodule/account.js';

/**
 * Fetches the actor account, preserving the underlying fetch failure as
 * `cause` so the real reason (e.g. a transient repository error) isn't
 * lost behind a generic "not found".
 */
export const fetchActor = async (
  accountModule: AccountModuleFacade,
  authorID: AccountID,
): Promise<Result.Result<AccountNotFoundError, Account>> => {
  return accountModule
    .fetchAccount(authorID)
    .then(
      Result.mapErr(
        (cause) => new AccountNotFoundError('Account not found', { cause }),
      ),
    );
};
