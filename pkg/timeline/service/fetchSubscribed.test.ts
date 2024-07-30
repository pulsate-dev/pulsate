import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { List, type ListID } from '../model/list.js';
import { FetchSubscribedListService } from './fetchSubscribed.js';

describe('FetchSubscribedListService', () => {
  const dummyList = List.new({
    id: '1' as ListID,
    title: 'dummy',
    memberIds: ['101' as AccountID],
    publicity: 'PUBLIC',
    ownerId: '100' as AccountID,
    createdAt: new Date('2023-09-10T00:00:00.000Z'),
  });
  const listRepository = new InMemoryListRepository([dummyList]);
  const fetchService = new FetchSubscribedListService(listRepository);

  it('should fetch list by member account ID', async () => {
    const res = await fetchService.handle('101' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(['1' as AccountID]);
  });
});
