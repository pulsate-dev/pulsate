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
import { FreezeService } from './freeze.ts';

const testAccounts = [
  // NOTE: target account
  generateDummyAccount({ name: '@john@example.com' }),
  // NOTE: actor account
  generateDummyAccount({ name: '@alice@example.com', role: 'admin' }),
  // NOTE: actor account(moderator)
  generateDummyAccount({ name: '@bob@example.com', role: 'moderator' }),
  // NOTE: actor account(normal)
  generateDummyAccount({ name: '@carol@example.com' }),
  // NOTE: target account(frozen)
  generateDummyAccount({ name: '@david@example.com', frozen: 'frozen' }),
];
const repository = new InMemoryAccountRepository();
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const freezeService = new FreezeService(repository, eventPublisher);

describe('FreezeService', () => {
  beforeEach(() => {
    repository.reset(testAccounts);
    vi.clearAllMocks();
  });

  it('set account freeze', async () => {
    const account = Option.unwrap(
      await repository.findByName('@john@example.com'),
    );

    await freezeService.setFreeze('@john@example.com', '@alice@example.com');

    expect(account.isFrozen()).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.admin.frozen' }),
    ]);
  });

  it('unset account freeze', async () => {
    await freezeService.setFreeze('@john@example.com', '@alice@example.com');

    await freezeService.undoFreeze('@john@example.com', '@alice@example.com');

    const account = Option.unwrap(
      await repository.findByName('@john@example.com'),
    );

    expect(account.isFrozen()).toBe(false);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.admin.unfrozen' }),
    ]);
  });

  describe('permission check', () => {
    beforeEach(() => repository.reset(testAccounts));

    it('cannot freeze self', async () => {
      const result = await freezeService.setFreeze(
        '@alice@example.com',
        '@alice@example.com',
      );
      const account = Option.unwrap(
        await repository.findByName('@alice@example.com'),
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));
      expect(account.isFrozen()).toBe(false);
    });

    it('cannot unFreeze self', async () => {
      const result = await freezeService.undoFreeze(
        '@alice@example.com',
        '@alice@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));
    });

    it('cannot freeze/unFreeze if actor is not admin or moderator', async () => {
      const result = await freezeService.setFreeze(
        '@john@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));

      const unFreezeRes = await freezeService.undoFreeze(
        '@david@example.com',
        '@john@example.com',
      );
      expect(Result.isErr(unFreezeRes)).toBe(true);
      expect(unFreezeRes[1]).toStrictEqual(new Error('not allowed'));
    });

    it('moderator can freeze/unFreeze only normal account', async () => {
      const result = await freezeService.setFreeze(
        '@john@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));

      const unFreezeRes = await freezeService.undoFreeze(
        '@david@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(unFreezeRes)).toBe(true);
      expect(unFreezeRes[1]).toStrictEqual(new Error('not allowed'));
    });
  });
});
