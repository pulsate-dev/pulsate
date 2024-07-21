import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { List, type ListID } from '../model/list.js';
import { DeleteListService } from './deleteList.js';

const testList = List.new({
  id: '1' as ListID,
  createdAt: new Date(2023, 9, 10, 0, 0),
  memberIds: [],
  ownerId: '' as AccountID,
  publicity: 'PUBLIC',
  title: 'Test List',
});

describe('DeleteListService', () => {
  const repository = new InMemoryListRepository([testList]);
  const service = new DeleteListService(repository);

  it('should delete a list', async () => {
    const res = await service.handle('1' as ListID);

    expect(Result.isOk(res)).toBe(true);
  });
  it('should be error when try delete not existing list', async () => {
    const res = await service.handle('2' as ListID);

    expect(Result.isErr(res)).toBe(true);
  });
});
