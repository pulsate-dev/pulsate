import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.ts';
import type { ListID } from '../model/list.ts';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.ts';
import { ListTimelineService } from './list.ts';

describe('ListTimelineService', () => {
  const cache = new InMemoryTimelineCacheRepository();
  cache.addNotesToList('1' as ListID, [dummyPublicNote, dummyHomeNote]);
  const repository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
  ]);
  const service = new ListTimelineService(cache, repository);

  it('should fetch list timeline notes', async () => {
    const res = await service.handle('1' as ListID, {
      hasAttachment: false,
      noNsfw: false,
    });
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toHaveLength(2);
    expect(Result.unwrap(res)).toStrictEqual([dummyHomeNote, dummyPublicNote]);
  });

  it('should notes sorted by ID, descending', async () => {
    const res = await service.handle('1' as ListID, {
      hasAttachment: false,
      noNsfw: false,
    });
    const sorted = [dummyPublicNote, dummyHomeNote].sort((a, b) =>
      Number(BigInt(b.getID()) - BigInt(a.getID())),
    );
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(sorted);
  });
});
