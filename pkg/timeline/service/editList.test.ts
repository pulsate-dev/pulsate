import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { ListTitleLengthInvalidError } from '../model/errors.js';
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
    repository.reset();
    await repository.create(List.reconstruct(testListData));
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

  it('should return ListTitleLengthInvalidError when title is empty', async () => {
    const res = await service.editTitle('1' as ListID, '');

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    expect(testList.getTitle()).toBe('Test List');
  });

  it('should return ListTitleLengthInvalidError when title exceeds 100 chars', async () => {
    const tooLong = 'a'.repeat(101);
    const res = await service.editTitle('1' as ListID, tooLong);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    expect(testList.getTitle()).toBe('Test List');
  });
});
