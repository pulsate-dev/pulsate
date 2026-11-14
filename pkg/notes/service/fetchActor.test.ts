import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../accounts/model/errors.ts';
import { dummyNormalAccount1 } from '../../accounts/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { fetchActor } from './fetchActor.ts';

describe('fetchActor', () => {
  it('returns the account when found', async () => {
    const res = await fetchActor(
      dummyAccountModuleFacade,
      dummyNormalAccount1.getID(),
    );

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getID()).toBe(dummyNormalAccount1.getID());
  });

  it('preserves the underlying fetch failure as cause when the account is missing', async () => {
    const res = await fetchActor(
      dummyAccountModuleFacade,
      generateDummyID<Account>(),
    );

    expect(Result.isErr(res)).toBe(true);
    const err = Result.unwrapErr(res);
    expect(err).toBeInstanceOf(AccountNotFoundError);
    expect(err.cause).not.toBeNull();
  });
});
