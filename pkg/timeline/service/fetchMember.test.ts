import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { dummyAccounts } from '../../accounts/testData/testData.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { List, type ListID } from '../model/list.js';
import { FetchListMemberService } from './fetchMember.js';

describe('FetchListMemberService', () => {
  const dummyListData = List.new({
    id: '1' as ListID,
    title: 'List',
    publicity: 'PRIVATE',
    memberIds: ['11' as AccountID, '12' as AccountID],
    ownerId: '1' as AccountID,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  });
  const repository = new InMemoryListRepository([dummyListData]);
  const service = new FetchListMemberService(
    repository,
    dummyAccountModuleFacade,
  );

  it('should fetch list members', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchAccounts').mockImplementation(
      async () => {
        return Result.ok(dummyAccounts);
      },
    );

    const res = await service.handle('1' as ListID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(dummyAccounts);
  });
});
