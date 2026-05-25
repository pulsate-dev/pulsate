import { Option } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { Account, type AccountID } from '../model/account.js';
import { SilenceService } from './silence.js';

const repository = new InMemoryAccountRepository();
const silenceService = new SilenceService(repository);

const resetRepository = () => {
  repository.reset([
    Account.reconstruct({
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
    }),
    Account.reconstruct({
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
    }),
  ]);
};

describe('SilenceService', () => {
  beforeEach(() => resetRepository());

  it('set account silence', async () => {
    await silenceService.setSilence('@john@example.com', '@alice@example.com');

    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;
    expect(account[1].isSilenced()).toBe(true);
  });

  it('unset account silence', async () => {
    await silenceService.setSilence('@john@example.com', '@alice@example.com');

    await silenceService.undoSilence('@john@example.com', '@alice@example.com');

    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;
    expect(account[1].isSilenced()).toBe(false);
  });
});
