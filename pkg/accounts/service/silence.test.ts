import { Option } from '@mikuroxina/mini-fn';
import { describe, it, expect, afterEach } from 'vitest';

import type { ID } from '../../id/type.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { SilenceService } from './silence.js';

const repository = new InMemoryAccountRepository();
repository.create(
  Account.new({
    id: '1' as ID<AccountID>,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    nickname: 'John Doe',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'notActivated',
    createdAt: new Date(),
  }),
);
const silenceService = new SilenceService(repository);

describe('SilenceService', () => {
  afterEach(() => repository.reset());

  it('set account silence', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await silenceService.setSilence('@john@example.com');

    expect(account[1].getSilenced).toBe('silenced');
    expect(account[1].getSilenced).not.toBe('normal');
  });

  it('unset account silence', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await silenceService.undoSilence('@john@example.com');

    expect(account[1].getSilenced).toBe('normal');
    expect(account[1].getSilenced).not.toBe('silenced');
  });
});
