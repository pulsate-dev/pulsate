import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { type CreateListArgs, List, type ListID } from '../model/list.js';
import { EditListService } from './editList.js';

const testListData: CreateListArgs = {
  id: '1' as ListID,
  createdAt: new Date(2023, 9, 10, 0, 0),
  memberIds: [],
  ownerId: '' as AccountID,
  publicity: 'PUBLIC',
  title: 'Test List',
};

const repository = new InMemoryListRepository();
const service = new EditListService(repository);

describe('EditListService', () => {
  let testList: List;
  beforeEach(async () => {
    await repository.create(List.new(testListData));
    const res = await repository.fetchList('1' as ListID);
    if (Result.isErr(res)) return;

    testList = Result.unwrap(res);
  });

  it('should edit publicity', async () => {
    const res = await service.editPublicity('1' as ListID, 'PRIVATE');

    expect(Result.isOk(res)).toBe(true);
    expect(testList.isPublic()).toBe(false);
    expect((await repository.fetchList('1' as ListID))[1]).toBe(testList);
  });

  it('should edit title', async () => {
    const res = await service.editTitle('1' as ListID, 'Edited');

    expect(Result.isOk(res)).toBe(true);
    expect(testList.getTitle()).toBe('Edited');
    expect((await repository.fetchList('1' as ListID))[1]).toBe(testList);
  });
});
