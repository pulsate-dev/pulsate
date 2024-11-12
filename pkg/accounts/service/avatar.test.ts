import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMediaRepository } from '../../drive/adaptor/repository/dummy.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  testMedium,
  testNSFWMedium,
  testOtherMedium,
} from '../../drive/testData/testData.js';
import { dummyMediaModuleFacade } from '../../intermodule/media.js';
import { InMemoryAccountAvatarRepository } from '../adaptor/repository/dummy/avatar.js';
import type { AccountID } from '../model/account.js';
import { AccountInsufficientPermissionError } from '../model/errors.js';
import { AccountAvatarService } from './avatar.js';

describe('AccountAvatarService', () => {
  const avatarRepository = new InMemoryAccountAvatarRepository();
  beforeEach(() => {
    avatarRepository.reset([testMedium, testNSFWMedium, testOtherMedium]);
  });

  const mediaModule = dummyMediaModuleFacade(
    new InMemoryMediaRepository([testMedium, testNSFWMedium, testOtherMedium]),
  );
  const service = new AccountAvatarService(avatarRepository, mediaModule);

  it('should set account avatar image', async () => {
    const res = await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account avatar image if medium is NSFW', async () => {
    const res = await service.create(
      '101' as AccountID,
      '301' as MediumID,
      '101' as AccountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account avatar image', async () => {
    await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );

    const res = await service.delete('101' as AccountID, '101' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's avatar image", async () => {
    await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );

    const res = await avatarRepository.findByID('101' as AccountID);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getId()).toBe('300');
  });

  it('set: actor must same as target account', async () => {
    const res = await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '1' as AccountID,
    );
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });

  it('set: medium author must same as actor', async () => {
    const res = await service.create(
      '101' as AccountID,
      testOtherMedium.getId(),
      '101' as AccountID,
    );
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });

  it('unset: actor must same as target account', async () => {
    const res = await service.delete('101' as AccountID, '1' as AccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });
});
