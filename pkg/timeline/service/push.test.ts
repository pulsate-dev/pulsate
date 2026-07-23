import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { partialAccount1 } from '../../accounts/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { addSecondsToDate } from '../../internal/time/mod.ts';
import { Note, type NoteID } from '../../notes/model/note.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.ts';
import { List, type ListID } from '../model/list.ts';
import {
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.ts';
import { FetchSubscribedListService } from './fetchSubscribed.ts';
import { NoteVisibilityService } from './noteVisibility.ts';
import { PushTimelineService } from './push.ts';

describe('PushTimelineService', () => {
  const dummyList = List.reconstruct({
    id: '10' as ListID,
    title: 'dummy',
    memberIds: ['100' as AccountID],
    publicity: 'PUBLIC',
    ownerId: '101' as AccountID,
    createdAt: new Date('2023-09-10T00:00:00.000Z'),
  });

  const noteVisibility = new NoteVisibilityService(dummyAccountModuleFacade);
  const timelineCacheRepository = new InMemoryTimelineCacheRepository([
    ['100' as AccountID, []],
    ['101' as AccountID, []],
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
        ['100' as AccountID, []],
        ['101' as AccountID, []],
      ],
      [['10' as ListID, []]],
    );
  });

  it('push to home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);

    expect(Result.unwrap(res)).toBe(undefined);
  });

  it('push to author home timeline', async () => {
    const res = await pushTimelineService.handle(dummyPublicNote);
    const homeTimeline = await timelineCacheRepository.getHomeTimeline(
      '100' as AccountID,
    );
    expect(Result.unwrap(res)).toBe(undefined);
    expect(Result.isErr(homeTimeline)).toBe(false);
    expect(Result.unwrap(homeTimeline)).toEqual(['1' as NoteID]);
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

  it("if Note.visibility is FOLLOWERS, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyFollowersNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(
      Result.unwrap(listTimeline).includes(dummyFollowersNote.getID()),
    ).toBe(false);
  });

  it('if Cache limit reached, delete oldest note', async () => {
    const data = [...new Array(300)].map((_, i) => {
      return Result.unwrap(
        Note.new({
          id: (i + 1).toString() as NoteID,
          authorID: '100' as AccountID,
          content: `Hello world ${i}`,
          contentsWarningComment: '',
          originalNoteID: Option.none(),
          attachmentFileID: [],
          sendTo: Option.none(),
          visibility: 'PUBLIC',
          createdAt: addSecondsToDate(
            new Date('2023/09/10 00:00:00'),
            3600 * 24 * i,
          ),
        }),
      );
    });

    for (const v of data) {
      await pushTimelineService.handle(v);
    }

    await pushTimelineService.handle(dummyHomeNote);

    const listData = Result.unwrap(
      await timelineCacheRepository.getListTimeline('10' as ListID),
    );
    expect(listData.length).toBe(300);
    expect(listData.includes('1' as NoteID)).toBe(false);
  });
});
