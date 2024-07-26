import type { PartialAccount } from '../../intermodule/account.js';
import { Account, type AccountID } from '../model/account.js';

export const dummyAccount1 = Account.new({
  id: '101' as AccountID,
  bio: 'this is test user',
  mail: 'john@example.com',
  name: '@john@example.com',
  nickname: 'John Doe',
  passphraseHash: '',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});
export const dummyAccount2 = Account.new({
  id: '102' as AccountID,
  bio: 'Hello world ✨',
  mail: 'john@example.com',
  name: '@johndoe@example.com',
  nickname: '🌤 John',
  passphraseHash: '',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-11T00:00:00Z'),
});
export const dummyAccounts = [dummyAccount1, dummyAccount2];

export const partialAccount1: PartialAccount = {
  id: dummyAccount1.getID(),
  name: dummyAccount1.getName(),
  nickname: dummyAccount1.getNickname(),
  bio: dummyAccount1.getBio(),
};
export const partialAccount2: PartialAccount = {
  id: dummyAccount2.getID(),
  name: dummyAccount2.getName(),
  nickname: dummyAccount2.getNickname(),
  bio: dummyAccount2.getBio(),
};
export const partialAccounts = [partialAccount1, partialAccount2];
