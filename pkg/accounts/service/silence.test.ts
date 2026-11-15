import { Option, Result } from '@mikuroxina/mini-fn';
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
import { generateDummyAccount } from '../testData/testData.ts';
import { SilenceService } from './silence.ts';

const repository = new InMemoryAccountRepository();
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const silenceService = new SilenceService(repository, eventPublisher);

const resetRepository = () => {
  repository.reset([
    generateDummyAccount({ name: '@john@example.com' }),
    generateDummyAccount({ name: '@alice@example.com', role: 'admin' }),
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
