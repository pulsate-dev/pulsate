import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { partialAccount1 } from '../../accounts/testData/testData.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import type { NoteID } from '../../notes/model/note.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import { List, type ListID } from '../model/list.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { FetchSubscribedListService } from './fetchSubscribed.js';
import { NoteVisibilityService } from './noteVisibility.js';
import { PushTimelineService } from './push.js';

describe('PushTimelineService', () => {
  const dummyList = List.new({
    id: '10' as ListID,
    title: 'dummy',
    memberIds: ['100' as AccountID],
    publicity: 'PUBLIC',
    ownerId: '101' as AccountID,
    createdAt: new Date('2023-09-10T00:00:00.000Z'),
  });

  const noteVisibility = new NoteVisibilityService(dummyAccountModuleFacade);
  const timelineCacheRepository = new InMemoryTimelineCacheRepository();
  const listRepository = new InMemoryListRepository([dummyList]);
  const fetchSubscribedListService = new FetchSubscribedListService(
    listRepository,
  );
  const pushTimelineService = new PushTimelineService(
    dummyAccountModuleFacade,
    noteVisibility,
    timelineCacheRepository,
    fetchSubscribedListService,
  );

  beforeEach(() => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );
    timelineCacheRepository.reset();
  });

  it('push to home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);

    expect(Result.unwrap(res)).toBe(undefined);
  });

  it('push to list', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );

    expect(Result.unwrap(res)).toBe(undefined);
    expect(Result.isErr(listTimeline)).toBe(false);
    expect(Result.unwrap(listTimeline)).toEqual(['1' as NoteID]);
  });

  it("if Note.visibility is DIRECT, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyDirectNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.isErr(listTimeline)).toBe(true);
  });

  it("if Note.visibility is FOLLOWERS, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyFollowersNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.isErr(listTimeline)).toBe(true);
  });
});
