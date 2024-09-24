import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import type { ListID } from '../model/list.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { ListTimelineService } from './list.js';

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
    const res = await service.handle('1' as ListID);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toHaveLength(2);
    expect(Result.unwrap(res)).toStrictEqual([dummyHomeNote, dummyPublicNote]);
  });

  it('should notes sorted by createdAt, descending', async () => {
    const res = await service.handle('1' as ListID);
    const sorted = [dummyPublicNote, dummyHomeNote].sort(
      (a, b) => b.getCreatedAt().getDate() - a.getCreatedAt().getDate(),
    );
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(sorted);
  });
});
