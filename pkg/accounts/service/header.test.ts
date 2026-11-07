import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMediaRepository } from '../../drive/adaptor/repository/dummy.ts';
import {
  testMedium,
  testNSFWMedium,
  testOtherMedium,
} from '../../drive/testData/testData.ts';
import { dummyMediaModuleFacade } from '../../intermodule/media.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryAccountHeaderRepository } from '../adaptor/repository/dummy/header.ts';
import type { Account } from '../model/account.ts';
import { AccountInsufficientPermissionError } from '../model/errors.ts';
import { AccountHeaderService } from './header.ts';

const owner = testMedium.getAuthorId();
const otherAccount = generateDummyID<Account>();

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
    const res = await service.create(owner, testMedium.getId(), owner);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account header image if medium is NSFW', async () => {
    const res = await service.create(owner, testNSFWMedium.getId(), owner);
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account header image', async () => {
    await service.create(owner, testMedium.getId(), owner);

    const res = await service.delete(owner, owner);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's header image", async () => {
    await service.create(owner, testMedium.getId(), owner);

    const res = await headerRepository.findByID(owner);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getId()).toBe(testMedium.getId());
  });

  it('set: actor must same as target account', async () => {
    const res = await service.create(owner, testMedium.getId(), otherAccount);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });

  it('set: medium author must same as actor', async () => {
    const res = await service.create(owner, testOtherMedium.getId(), owner);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });

  it('unset: actor must same as target account', async () => {
    const res = await service.delete(owner, otherAccount);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      AccountInsufficientPermissionError,
    );
  });
});
