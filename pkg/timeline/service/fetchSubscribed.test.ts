import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { generateDummyList } from '../testData/testData.ts';
import { FetchSubscribedListService } from './fetchSubscribed.ts';

describe('FetchSubscribedListService', () => {
  const memberId = generateDummyID<Account>();
  const dummyList = generateDummyList({ memberIds: [memberId] });
  const listRepository = new InMemoryListRepository([dummyList]);
  const fetchService = new FetchSubscribedListService(listRepository);

  it('should fetch list by member account ID', async () => {
    const res = await fetchService.handle(memberId);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([dummyList.getId()]);
  });
});
