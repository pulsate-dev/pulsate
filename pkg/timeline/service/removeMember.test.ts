import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import { List, type ListID } from '../model/list.js';
import { RemoveListMemberService } from './removeMember.js';

describe('RemoveListMemberService', () => {
  const listData = [
    List.new({
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      id: '10' as ListID,
      memberIds: ['2' as AccountID, '3' as AccountID],
      ownerId: '1' as AccountID,
      publicity: 'PUBLIC',
      title: 'ABC',
    }),
  ];
  const listRepository = new InMemoryListRepository(listData);
  const service = new RemoveListMemberService(listRepository);

  beforeEach(() => {
    listRepository.reset(listData);
  });

  it('should remove member from list', async () => {
    const res = await service.handle(
      '10' as ListID,
      '2' as AccountID,
      '1' as AccountID,
    );
    const listRes = await listRepository.fetchListMembers('10' as ListID);

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(listRes)).toHaveLength(1);
  });

  it("should return error if list doesn't exist", async () => {
    const res = await service.handle(
      '20' as ListID,
      '200' as AccountID,
      '1' as AccountID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListNotFoundError);
  });

  it('should return error if actor does not own the list', async () => {
    const res = await service.handle(
      '10' as ListID,
      '2' as AccountID,
      '2' as AccountID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      TimelineInsufficientPermissionError,
    );
  });
});
