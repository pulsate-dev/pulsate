import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { dummyNormalAccount1 } from '../../accounts/testData/testData.ts';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.ts';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.ts';
import { HomeTimelineService } from './home.ts';

describe('HomeTimelineService', () => {
  const timelineCacheRepository = new InMemoryTimelineCacheRepository([
    [
      dummyNormalAccount1.getID(),
      [
        dummyPublicNote.getID(),
        dummyHomeNote.getID(),
        dummyFollowersNote.getID(),
      ],
    ],
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
      dummyNormalAccount1.getID(),
      {
        hasAttachment: false,
        noNsfw: false,
      },
    );

    expect(Result.unwrap(res).map((v) => v.getID())).toStrictEqual([
      dummyFollowersNote.getID(),
      dummyHomeNote.getID(),
      dummyPublicNote.getID(),
    ]);
  });

  it('with beforeId cursor', async () => {
    const res = await homeTimelineService.fetchHomeTimeline(
      dummyNormalAccount1.getID(),
      {
        hasAttachment: false,
        noNsfw: false,
        beforeId: dummyHomeNote.getID(),
      },
    );

    expect(Result.unwrap(res).map((v) => v.getID())).toStrictEqual([
      dummyPublicNote.getID(),
    ]);
  });

  it('with afterID cursor', async () => {
    const res = await homeTimelineService.fetchHomeTimeline(
      dummyNormalAccount1.getID(),
      {
        hasAttachment: false,
        noNsfw: false,
        afterId: dummyHomeNote.getID(),
      },
    );

    expect(Result.unwrap(res).map((v) => v.getID())).toStrictEqual([
      dummyFollowersNote.getID(),
    ]);
  });

  it('with both beforeId and afterID cursor', async () => {
    const res = await homeTimelineService.fetchHomeTimeline(
      dummyNormalAccount1.getID(),
      {
        hasAttachment: false,
        noNsfw: false,
        beforeId: dummyPublicNote.getID(),
        afterId: dummyFollowersNote.getID(),
      },
    );

    expect(Result.isErr(res)).toBe(true);
  });
});
