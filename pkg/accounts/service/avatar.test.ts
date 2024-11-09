import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMediaRepository } from '../../drive/adaptor/repository/dummy.js';
import type { MediumID } from '../../drive/model/medium.js';
import { testMedium, testNSFWMedium } from '../../drive/testData/testData.js';
import { dummyMediaModuleFacade } from '../../intermodule/media.js';
import { InMemoryAccountAvatarRepository } from '../adaptor/repository/dummy/avatar.js';
import type { AccountID } from '../model/account.js';
import { AccountAvatarService } from './avatar.js';

describe('AccountAvatarService', () => {
  const avatarRepository = new InMemoryAccountAvatarRepository();
  beforeEach(() => {
    avatarRepository.reset([testMedium, testNSFWMedium]);
  });

  const mediaModule = dummyMediaModuleFacade(
    new InMemoryMediaRepository([testMedium, testNSFWMedium]),
  );
  const service = new AccountAvatarService(avatarRepository, mediaModule);

  it('Should set account avatar image', async () => {
    const res = await service.create('1' as AccountID, '300' as MediumID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account avatar image if medium is NSFW', async () => {
    const res = await service.create('1' as AccountID, '301' as MediumID);
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account avatar image', async () => {
    await service.create('1' as AccountID, '300' as MediumID);

    const res = await service.delete('1' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's avatar image", async () => {
    await service.create('1' as AccountID, '300' as MediumID);

    const res = await avatarRepository.findByID('1' as AccountID);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getId()).toBe('300');
  });
});
