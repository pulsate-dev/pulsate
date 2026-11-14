import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { ListTitleLengthInvalidError } from '../model/errors.ts';
import type { List } from '../model/list.ts';
import { generateDummyList } from '../testData/testData.ts';
import { EditListService } from './editList.ts';

const repository = new InMemoryListRepository();
const service = new EditListService(repository);

describe('EditListService', () => {
  let testList: List;
  beforeEach(async () => {
    repository.reset();
    testList = generateDummyList({ title: 'Test List' });
    await repository.create(testList);
  });

  it('should edit publicity', async () => {
    const res = await service.editPublicity(testList.getId(), 'PRIVATE');

    expect(Result.isOk(res)).toBe(true);
    expect(testList.isPublic()).toBe(false);
    expect((await repository.fetchList(testList.getId()))[1]).toBe(testList);
  });

  it('should edit title', async () => {
    const res = await service.editTitle(testList.getId(), 'Edited');

    expect(Result.isOk(res)).toBe(true);
    expect(testList.getTitle()).toBe('Edited');
    expect((await repository.fetchList(testList.getId()))[1]).toBe(testList);
  });

  it('should return ListTitleLengthInvalidError when title is empty', async () => {
    const res = await service.editTitle(testList.getId(), '');

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    expect(testList.getTitle()).toBe('Test List');
  });

  it('should return ListTitleLengthInvalidError when title exceeds 100 chars', async () => {
    const tooLong = 'a'.repeat(101);
    const res = await service.editTitle(testList.getId(), tooLong);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    expect(testList.getTitle()).toBe('Test List');
  });
});
