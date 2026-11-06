import { Option } from '@mikuroxina/mini-fn';
import type { PartialAccount } from '../../intermodule/account.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import {
  Account,
  type AccountID,
  type CreateAccountArgs,
} from '../model/account.ts';
import {
  AccountFollow,
  type AccountFollowConstructorArgs,
} from '../model/follow.ts';

/**
 * @description generate dummy account (factory function)
 * @param overrides fields to override the default dummy values
 * @returns {@link Account}
 */
export const generateDummyAccount = (
  overrides: Partial<CreateAccountArgs> = {},
): Account => {
  const createdAt = overrides.createdAt ?? DUMMY_BASE_DATE;
  const id = overrides.id ?? generateDummyID<Account>(createdAt);
  return Account.reconstruct({
    id,
    bio: 'this is test user',
    mail: `testuser${id}@example.com`,
    name: `@testuser${id}@example.com`,
    nickname: `test user ${id}`,
    // argon2id hash of "じゃすた・いぐざんぽぅ"
    passphraseHash:
      '$argon2id$v=19$m=65536,t=3,p=4$nbT6iNnvk6tC9o4sH15dHw$1UkaTHDAA4EHe9EAyCh22+hUGj2s1obVhDAqwFYMFfo',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    frozen: 'normal',
    ...overrides,
    createdAt,
  });
};

/**
 * @description generate dummy accounts created one second apart in ascending order
 * @param count number of accounts
 * @param overrides fields to override for the `index`-th account
 */
export const generateDummyAccounts = (
  count: number,
  overrides: (index: number) => Partial<CreateAccountArgs> = () => ({}),
): Account[] =>
  Array.from({ length: count }, (_, index) =>
    generateDummyAccount({
      createdAt: addDuration(DUMMY_BASE_DATE, { seconds: index }),
      ...overrides(index),
    }),
  );

/**
 * @description generate dummy follow relationship (factory function)
 * @param args follower/followee and fields to override the default dummy values
 * @returns {@link AccountFollow}
 */
export const generateDummyFollow = (
  args: Pick<AccountFollowConstructorArgs, 'fromID' | 'targetID'> &
    Partial<AccountFollowConstructorArgs>,
): AccountFollow =>
  AccountFollow.reconstruct({
    createdAt: DUMMY_BASE_DATE,
    deletedAt: Option.none(),
    ...args,
  });

export const dummyNormalAccount1 = generateDummyAccount({
  id: '101' as AccountID,
  name: '@john@example.com',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});
export const dummyNormalAccount2 = generateDummyAccount({
  id: '102' as AccountID,
  name: '@johndoe@example.com',
  createdAt: new Date('2023-09-11T00:00:00Z'),
});
export const dummyNormalAccount3 = generateDummyAccount({
  id: '103' as AccountID,
  name: '@alice@example.com',
  createdAt: new Date('2023-09-12T00:00:00Z'),
});
export const dummyFrozenAccount = generateDummyAccount({
  id: '104' as AccountID,
  name: '@frozen@example.com',
  frozen: 'frozen',
  createdAt: new Date('2023-09-13T00:00:00Z'),
});
export const dummySilencedAccount = generateDummyAccount({
  id: '105' as AccountID,
  name: '@silenced@example.com',
  silenced: 'silenced',
  createdAt: new Date('2023-09-14T00:00:00Z'),
});

export const dummyAccounts = [
  dummyNormalAccount1,
  dummyNormalAccount2,
  dummyNormalAccount3,
  dummyFrozenAccount,
  dummySilencedAccount,
];

const toPartialAccount = (account: Account): PartialAccount => ({
  id: account.getID(),
  name: account.getName(),
  nickname: account.getNickname(),
  bio: account.getBio(),
});
export const partialAccount1 = toPartialAccount(dummyNormalAccount1);
export const partialAccount2 = toPartialAccount(dummyNormalAccount2);
export const partialAccounts = [partialAccount1, partialAccount2];

export const dummyfollows: AccountFollow[] = [
  generateDummyFollow({
    fromID: dummyNormalAccount1.getID(),
    targetID: dummyNormalAccount2.getID(),
    createdAt: new Date('2023-09-12T00:00:00Z'),
  }),
  generateDummyFollow({
    fromID: dummyNormalAccount2.getID(),
    targetID: dummyNormalAccount1.getID(),
    createdAt: new Date('2023-09-13T00:00:00Z'),
  }),
  generateDummyFollow({
    fromID: dummyNormalAccount3.getID(),
    targetID: dummyNormalAccount1.getID(),
    createdAt: new Date('2023-09-14T00:00:00Z'),
  }),
];
