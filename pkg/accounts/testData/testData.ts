import type { PartialAccount } from '../../intermodule/account.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountName,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../model/account.js';
import { AccountFollow } from '../model/follow.js';

/**
 * @description generate dummy account (factory function)
 * @param args dummy accont's data
 * @returns {@link Account}
 */
export const generateDummyAccount = (args: {
  id: AccountID;
  name: AccountName;
  role: AccountRole;
  silenced: AccountSilenced;
  status: AccountStatus;
  frozen: AccountFrozen;
  createdAt: Date;
}): Account => {
  return Account.reconstruct({
    id: args.id,
    bio: 'this is test user',
    mail: 'testuser@example.com',
    name: args.name,
    nickname: `test user ${args.id}`,
    // argon2id hash of "じゃすた・いぐざんぽぅ"
    passphraseHash:
      '$argon2id$v=19$m=65536,t=3,p=4$nbT6iNnvk6tC9o4sH15dHw$1UkaTHDAA4EHe9EAyCh22+hUGj2s1obVhDAqwFYMFfo',
    role: args.role,
    silenced: args.silenced,
    status: args.status,
    frozen: args.frozen,
    createdAt: args.createdAt,
  });
};

export const dummyNormalAccount1 = generateDummyAccount({
  id: '101' as AccountID,
  name: '@john@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});
export const dummyNormalAccount2 = generateDummyAccount({
  id: '102' as AccountID,
  name: '@johndoe@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-11T00:00:00Z'),
});
export const dummyNormalAccount3 = generateDummyAccount({
  id: '103' as AccountID,
  name: '@alice@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-12T00:00:00Z'),
});
export const dummyFrozenAccount = generateDummyAccount({
  id: '104' as AccountID,
  name: '@frozen@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'frozen',
  createdAt: new Date('2023-09-13T00:00:00Z'),
});
export const dummySilencedAccount = generateDummyAccount({
  id: '105' as AccountID,
  name: '@silenced@example.com',
  role: 'normal',
  silenced: 'silenced',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-14T00:00:00Z'),
});

export const dummyAccounts = [
  dummyNormalAccount1,
  dummyNormalAccount2,
  dummyNormalAccount3,
  dummyFrozenAccount,
  dummySilencedAccount,
];

export const partialAccount1: PartialAccount = {
  id: dummyNormalAccount1.getID(),
  name: dummyNormalAccount1.getName(),
  nickname: dummyNormalAccount1.getNickname(),
  bio: dummyNormalAccount1.getBio(),
};
export const partialAccount2: PartialAccount = {
  id: dummyNormalAccount2.getID(),
  name: dummyNormalAccount2.getName(),
  nickname: dummyNormalAccount2.getNickname(),
  bio: dummyNormalAccount2.getBio(),
};
export const partialAccounts = [partialAccount1, partialAccount2];

export const dummyfollows: AccountFollow[] = [
  AccountFollow.new({
    fromID: '101' as AccountID,
    targetID: '102' as AccountID,
    createdAt: new Date('2023-09-12T00:00:00Z'),
  }),
  AccountFollow.new({
    fromID: '102' as AccountID,
    targetID: '101' as AccountID,
    createdAt: new Date('2023-09-13T00:00:00Z'),
  }),
  AccountFollow.new({
    fromID: '103' as AccountID,
    targetID: '101' as AccountID,
    createdAt: new Date('2023-09-14T00:00:00Z'),
  }),
];
