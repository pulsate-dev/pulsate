import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { partialAccount1 } from '../../accounts/testData/testData.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { addSecondsToDate } from '../../time/mod.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import { List, type ListID } from '../model/list.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
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

  it("if Note.visibility is DIRECT, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyDirectNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrap(listTimeline).includes(dummyDirectNote.getID())).toBe(
      false,
    );
  });

  it("if Note.visibility is FOLLOWERS, don't push to List", async () => {
    const res = await pushTimelineService.handle(dummyFollowersNote);
    const listTimeline = await timelineCacheRepository.getListTimeline(
      '10' as ListID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrap(listTimeline).includes(dummyDirectNote.getID())).toBe(
      false,
    );
  });

  it('if Cache limit reached, delete oldest note', async () => {
    const data = [...new Array(300)].map((_, i) => {
      return Note.new({
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
      });
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
