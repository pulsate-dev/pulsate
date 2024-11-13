import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { Account, type AccountID } from '../model/account.js';
import { SilenceService } from './silence.js';

const testNormalAccount = Account.reconstruct({
  id: '1' as AccountID,
  name: '@john@example.com',
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphraseHash: 'hash',
  bio: '',
  role: 'normal',
  frozen: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date(),
});
const testAdminAccount = Account.reconstruct({
  id: '2' as AccountID,
  name: '@alice@example.com',
  mail: 'alice@example.com',
  nickname: 'Alice',
  passphraseHash: 'hash',
  bio: '',
  role: 'admin',
  frozen: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date(),
});
const repository = new InMemoryAccountRepository([
  testNormalAccount,
  testAdminAccount,
]);

const silenceService = new SilenceService(repository);

describe('SilenceService', () => {
  afterEach(() => repository.reset());

  it('set account silence', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await silenceService.setSilence('@john@example.com', '@alice@example.com');

    expect(account[1].getSilenced()).toBe('silenced');
    expect(account[1].getSilenced()).not.toBe('normal');
  });

  it('unset account silence', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await silenceService.undoSilence('@john@example.com', '@alice@example.com');

    expect(account[1].getSilenced()).toBe('normal');
    expect(account[1].getSilenced()).not.toBe('silenced');
  });
});
