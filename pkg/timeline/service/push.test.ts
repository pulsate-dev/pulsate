import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
} from '../../accounts/adaptor/repository/dummy.js';
import { FetchService as AccountFetchService } from '../../accounts/service/fetch.js';
import { FetchFollowService } from '../../accounts/service/fetchFollow.js';
import { AccountModuleFacade } from '../../intermodule/account.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import { dummyPublicNote, partialAccount1 } from '../testData/testData.js';
import { NoteVisibilityService } from './noteVisibility.js';
import { PushTimelineService } from './push.js';

describe('PushTimelineService', () => {
  const accountRepository = new InMemoryAccountRepository([]);
  const accountFollowRepository = new InMemoryAccountFollowRepository();
  const accountModule = new AccountModuleFacade(
    new AccountFetchService(accountRepository),
    new FetchFollowService(accountFollowRepository, accountRepository),
  );
  const noteVisibility = new NoteVisibilityService(accountModule);
  const timelineCacheRepository = new InMemoryTimelineCacheRepository();
  const pushTimelineService = new PushTimelineService(
    accountModule,
    noteVisibility,
    timelineCacheRepository,
  );

  beforeEach(() => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
    });
  });

  it('push to home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);

    expect(Result.unwrap(res)).toBe(undefined);
  });
});
