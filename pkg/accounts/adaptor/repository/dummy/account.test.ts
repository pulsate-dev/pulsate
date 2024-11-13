import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { Account, type AccountID } from '../../../model/account.js';

import { InMemoryAccountRepository } from './account.js';

describe('InMemoryAccountRepository', () => {
  const dummyInput: Account[] = [
    Account.new({
      id: '1' as AccountID,
      name: '@john@example.com',
      mail: 'johndoe@example.com',
      nickname: 'John Doe',
      bio: 'Hello, World!',
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'active',
      createdAt: new Date('2023-09-10T12:00:00Z'),
    }),
    Account.new({
      id: '2' as AccountID,
      name: '@alice@example.com',
      mail: 'alice@example.com',
      nickname: 'Alice',
      bio: 'Hello, World!',
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'active',
      createdAt: new Date('2023-09-11T12:00:00Z'),
    }),
    Account.new({
      id: '3' as AccountID,
      name: '@bob@example.com',
      mail: 'bob@example.com',
      nickname: 'bob',
      bio: 'Hello, World!',
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'active',
      createdAt: new Date('2023-09-12T12:00:00Z'),
    }),
  ];
  const repository = new InMemoryAccountRepository(dummyInput);

  it('should fetch many accounts by id', async () => {
    const result = await repository.findManyByID([
      '1' as AccountID,
      '2' as AccountID,
    ]);
    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([dummyInput[0], dummyInput[1]]);
  });
});
