import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryMediaRepository } from '../adaptor/repository/dummy.js';
import { Medium, type MediumID } from '../model/medium.js';
import { FetchMediaService } from './fetch.js';

describe('FetchMediaService', () => {
  const dummyMedium = Medium.new({
    id: '1' as MediumID,
    authorId: '10' as AccountID,
    hash: 'ssjrkgnkksjn',
    mime: 'img/png',
    name: 'main.png',
    nsfw: false,
    thumbnailUrl: 'https://example.com/thumbnail.png',
    url: 'https://example.com/main.png',
  });
  const mediaRepository = new InMemoryMediaRepository([dummyMedium]);
  const service = new FetchMediaService(mediaRepository);

  it('should fetch media by author ID', async () => {
    const res = await service.fetchMediaByAuthorID('10' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([dummyMedium]);
  });
});
