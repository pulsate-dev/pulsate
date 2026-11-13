import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dummyNormalAccount1,
  partialAccount1,
} from '../../accounts/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { generateDummyNote } from '../../notes/testData/testData.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.ts';
import {
  dummyFollowersNote,
  dummyHomeNote,
  dummyNoteAuthorID,
  dummyPublicNote,
  generateDummyList,
} from '../testData/testData.ts';
import { FetchSubscribedListService } from './fetchSubscribed.ts';
import { NoteVisibilityService } from './noteVisibility.ts';
import { PushTimelineService } from './push.ts';

describe('PushTimelineService', () => {
  const dummyList = generateDummyList({
    memberIds: [dummyNoteAuthorID],
    ownerId: dummyNormalAccount1.getID(),
  });

  const noteVisibility = new NoteVisibilityService(dummyAccountModuleFacade);
  const timelineCacheRepository = new InMemoryTimelineCacheRepository([
    [dummyNoteAuthorID, []],
    [dummyNormalAccount1.getID(), []],
  ]);
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
    timelineCacheRepository.reset(
      [
        [dummyNoteAuthorID, []],
        [dummyNormalAccount1.getID(), []],
      ],
      [[dummyList.getId(), []]],
    );
  });

  it('push to home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);

    expect(Result.unwrap(res)).toBe(undefined);
  });

  it('push to author home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);
    const homeTimeline =
      await timelineCacheRepository.getHomeTimeline(dummyNoteAuthorID);
    expect(Result.unwrap(res)).toBe(undefined);
    expect(Result.isErr(homeTimeline)).toBe(false);
    expect(Result.unwrap(homeTimeline)).toEqual([dummyPublicNote.getID()]);
  });

  it('push to list', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      dummyList.getId(),
    );
    expect(Result.unwrap(res)).toBe(undefined);
    expect(Result.isErr(listTimeline)).toBe(false);
    expect(Result.unwrap(listTimeline)).toEqual([dummyPublicNote.getID()]);
  });

  it("if Note.visibility is FOLLOWERS, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyFollowersNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      dummyList.getId(),
    );

    expect(Result.isErr(res)).toBe(true);
    expect(
      Result.unwrap(listTimeline).includes(dummyFollowersNote.getID()),
    ).toBe(false);
  });

  it('if Cache limit reached, delete oldest note', async () => {
    const data = Array.from({ length: 300 }, (_, i) =>
      generateDummyNote({
        authorID: dummyNoteAuthorID,
        content: `Hello world ${i}`,
        createdAt: addDuration(new Date('2023/09/10 00:00:00'), { days: i }),
      }),
    );

    const [oldestNote] = data;
    if (!oldestNote) throw new Error('unreachable');

    for (const v of data) {
      await pushTimelineService.handle(v);
    }

    await pushTimelineService.handle(dummyHomeNote);

    const listData = Result.unwrap(
      await timelineCacheRepository.getListTimeline(dummyList.getId()),
    );
    expect(listData.length).toBe(300);
    expect(listData.includes(oldestNote.getID())).toBe(false);
  });
});
