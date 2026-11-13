import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { generateDummyAccounts } from '../../../testData/testData.ts';
import { InMemoryAccountRepository } from './account.ts';

describe('InMemoryAccountRepository', () => {
  const dummyInput = generateDummyAccounts(3);
  const repository = new InMemoryAccountRepository(dummyInput);

  it('should fetch many accounts by id', async () => {
    const result = await repository.findManyByID(
      dummyInput.slice(0, 2).map((a) => a.getID()),
    );
    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([dummyInput[0], dummyInput[1]]);
  });
});
