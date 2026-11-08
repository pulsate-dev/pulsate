import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryMediaRepository } from '../adaptor/repository/dummy.ts';
import { generateDummyMedium } from '../testData/testData.ts';
import { FetchMediaService } from './fetch.ts';

describe('FetchMediaService', () => {
  const authorId = generateDummyID<Account>();
  const dummyMedium = generateDummyMedium({ authorId });
  const mediaRepository = new InMemoryMediaRepository([dummyMedium]);
  const service = new FetchMediaService(mediaRepository);

  it('should fetch media by author ID', async () => {
    const res = await service.fetchMediaByAuthorID(authorId);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([dummyMedium]);
  });
});
