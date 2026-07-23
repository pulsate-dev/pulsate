import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../accounts/model/errors.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { fetchActor } from './fetchActor.ts';

describe('fetchActor', () => {
  it('returns the account when found', async () => {
    const res = await fetchActor(dummyAccountModuleFacade, '101' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getID()).toBe('101' as AccountID);
  });

  it('preserves the underlying fetch failure as cause when the account is missing', async () => {
    const res = await fetchActor(dummyAccountModuleFacade, '999' as AccountID);

    expect(Result.isErr(res)).toBe(true);
    const err = Result.unwrapErr(res);
    expect(err).toBeInstanceOf(AccountNotFoundError);
    expect(err.cause).not.toBeNull();
  });
});
