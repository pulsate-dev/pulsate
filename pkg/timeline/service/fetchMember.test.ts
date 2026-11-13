import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import {
  dummyAccounts,
  dummyNormalAccount1,
  dummyNormalAccount2,
} from '../../accounts/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { generateDummyList } from '../testData/testData.ts';
import { FetchListMemberService } from './fetchMember.ts';

describe('FetchListMemberService', () => {
  const dummyListData = generateDummyList({
    publicity: 'PRIVATE',
    memberIds: [dummyNormalAccount1.getID(), dummyNormalAccount2.getID()],
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

    const res = await service.handle(dummyListData.getId());

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(dummyAccounts);
  });
});
