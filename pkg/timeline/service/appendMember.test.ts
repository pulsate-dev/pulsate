import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryListRepository } from '../adaptor/repository/dummy.js';
import {
  ListNotFoundError,
  ListTooManyMembersError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import { List, type ListID } from '../model/list.js';
import { AppendListMemberService } from './appendMember.js';

describe('AppendListMemberService', () => {
  const listData = [
    List.new({
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      id: '10' as ListID,
      memberIds: [],
      ownerId: '1' as AccountID,
      publicity: 'PUBLIC',
      title: 'ABC',
    }),
  ];
  const listRepository = new InMemoryListRepository(listData);
  const service = new AppendListMemberService(listRepository);

  beforeEach(() => {
    listRepository.reset(listData);
  });

  it('should append member to list', async () => {
    const res = await service.handle(
      '10' as ListID,
      '200' as AccountID,
      '1' as AccountID,
    );

    expect(Result.isErr(res)).toBe(false);
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

  it('should return error if member already exists', async () => {
    await service.handle('10' as ListID, '200' as AccountID, '1' as AccountID);
    const res = await service.handle(
      '10' as ListID,
      '200' as AccountID,
      '1' as AccountID,
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('should not append member if member count exceeds the limit (250)', async () => {
    const testData = Array.from(
      { length: 250 },
      (_, i) => (i + 1).toString() as AccountID,
    );
    for (const v of testData) {
      await service.handle('10' as ListID, v, '1' as AccountID);
    }

    const res = await service.handle(
      '10' as ListID,
      '251' as AccountID,
      '1' as AccountID,
    );
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTooManyMembersError);
  });

  it('should error if actor is not list owner', async () => {
    const res = await service.handle(
      '10' as ListID,
      '200' as AccountID,
      '2' as AccountID,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      TimelineInsufficientPermissionError,
    );
  });
});
