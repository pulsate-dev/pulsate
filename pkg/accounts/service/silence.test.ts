import { Option } from '@mikuroxina/mini-fn';
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedObject,
  vi,
} from 'vitest';

import type { EventPublisher } from '../../internal/event/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { Account, type AccountID } from '../model/account.ts';
import { SilenceService } from './silence.ts';

const repository = new InMemoryAccountRepository();
const eventPublisher = {
  publishMany: vi.fn(async () => undefined),
} as const satisfies MockedObject<EventPublisher>;
const silenceService = new SilenceService(repository, eventPublisher);

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
  beforeEach(() => {
    resetRepository();
    vi.clearAllMocks();
  });

  it('set account silence', async () => {
    await silenceService.setSilence('@john@example.com', '@alice@example.com');

    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;
    expect(account[1].isSilenced()).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.admin.silenced' }),
    ]);
  });

  it('unset account silence', async () => {
    await silenceService.setSilence('@john@example.com', '@alice@example.com');

    await silenceService.undoSilence('@john@example.com', '@alice@example.com');

    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;
    expect(account[1].isSilenced()).toBe(false);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.admin.unsilenced' }),
    ]);
  });
});
