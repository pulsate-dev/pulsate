import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMediaRepository } from '../../drive/adaptor/repository/dummy.js';
import type { MediumID } from '../../drive/model/medium.js';
import { testMedium, testNSFWMedium } from '../../drive/testData/testData.js';
import { dummyMediaModuleFacade } from '../../intermodule/media.js';
import { InMemoryAccountHeaderRepository } from '../adaptor/repository/dummy/header.js';
import type { AccountID } from '../model/account.js';
import { AccountHeaderService } from './header.js';

describe('AccountHeaderService', () => {
  const headerRepository = new InMemoryAccountHeaderRepository();
  beforeEach(() => {
    headerRepository.reset([testMedium, testNSFWMedium]);
  });

  const mediaModule = dummyMediaModuleFacade(
    new InMemoryMediaRepository([testMedium, testNSFWMedium]),
  );
  const service = new AccountHeaderService(headerRepository, mediaModule);

  it('Should set account header image', async () => {
    const res = await service.create('1' as AccountID, '300' as MediumID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should not set account header image if medium is NSFW', async () => {
    const res = await service.create('1' as AccountID, '301' as MediumID);
    expect(Result.isErr(res)).toBe(true);
  });

  it('should unset account header image', async () => {
    await service.create('1' as AccountID, '300' as MediumID);

    const res = await service.delete('1' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it("should fetch account's header image", async () => {
    await service.create('1' as AccountID, '300' as MediumID);

    const res = await headerRepository.findByID('1' as AccountID);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getId()).toBe('300');
  });
});
