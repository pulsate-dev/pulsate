import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../../notes/model/note.js';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { HomeTimelineService } from './home.js';

describe('HomeTimelineService', () => {
  const timelineCacheRepository = new InMemoryTimelineCacheRepository([
    ['101' as AccountID, ['1' as NoteID, '2' as NoteID, '3' as NoteID]],
  ]);
  const timelineRepository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
  ]);
  const homeTimelineService = new HomeTimelineService(
    timelineCacheRepository,
    timelineRepository,
  );

  it('Successfully get home timeline', async () => {
    const res = await homeTimelineService.fetchHomeTimeline(
      '101' as AccountID,
      {
        hasAttachment: false,
        noNsfw: false,
      },
    );

    expect(Result.unwrap(res).map((v) => v.getID())).toStrictEqual([
      '3',
      '2',
      '1',
    ]);
  });
});
