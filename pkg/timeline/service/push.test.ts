import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountModule } from '../../intermodule/account.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import { dummyPublicNote, partialAccount1 } from '../testData/testData.js';
import { NoteVisibilityService } from './noteVisibility.js';
import { PushTimelineService } from './push.js';

describe('PushTimelineService', () => {
  const accountModule = new AccountModule();
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
