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
import { InMemoryAccountAvatarRepository } from '../adaptor/repository/dummy/avatar.ts';
import type { Account } from '../model/account.ts';
import { AccountInsufficientPermissionError } from '../model/errors.ts';
import { AccountAvatarService } from './avatar.ts';

const owner = testMedium.getAuthorId();
const otherAccount = generateDummyID<Account>();

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
    const res = await service.create(owner, testMedium.getId(), owner);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account avatar image if medium is NSFW', async () => {
    const res = await service.create(owner, testNSFWMedium.getId(), owner);
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account avatar image', async () => {
    await service.create(owner, testMedium.getId(), owner);

    const res = await service.delete(owner, owner);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's avatar image", async () => {
    await service.create(owner, testMedium.getId(), owner);

    const res = await avatarRepository.findByID(owner);
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
