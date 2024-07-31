import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import { List, type ListID } from '../model/list.js';
import { FetchListService } from './fetchList.js';

const repository = new InMemoryListRepository([
  List.new({
    id: '1' as ListID,
    title: 'Test list',
    ownerId: '' as AccountID,
    createdAt: new Date(2023, 9, 10, 0, 0),
    memberIds: [],
    publicity: 'PUBLIC',
  }),
]);
const service = new FetchListService(repository);

describe('FetchListService', () => {
  it('get existing list', async () => {
    const res = await service.handle('1' as ListID);
    expect(Result.isOk(res)).toBe(true);
  });
  it('error when not exiting list', async () => {
    const res = await service.handle('100' as ListID);
    expect(Result.isErr(res)).toBe(true);
  });
});
