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
import { InMemoryAccountHeaderRepository } from '../adaptor/repository/dummy/header.js';
import type { AccountID } from '../model/account.js';
import { AccountInsufficientPermissionError } from '../model/errors.js';
import { AccountHeaderService } from './header.js';

describe('AccountHeaderService', () => {
  const headerRepository = new InMemoryAccountHeaderRepository();
  beforeEach(() => {
    headerRepository.reset([testMedium, testNSFWMedium, testOtherMedium]);
  });

  const mediaModule = dummyMediaModuleFacade(
    new InMemoryMediaRepository([testMedium, testNSFWMedium, testOtherMedium]),
  );
  const service = new AccountHeaderService(headerRepository, mediaModule);

  it('Should set account header image', async () => {
    const res = await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account header image if medium is NSFW', async () => {
    const res = await service.create(
      '101' as AccountID,
      '301' as MediumID,
      '101' as AccountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account header image', async () => {
    await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );

    const res = await service.delete('101' as AccountID, '101' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's header image", async () => {
    await service.create(
      '101' as AccountID,
      '300' as MediumID,
      '101' as AccountID,
    );

    const res = await headerRepository.findByID('101' as AccountID);
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
