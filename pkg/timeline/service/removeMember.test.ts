import { Result } from '@mikuroxina/mini-fn';
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedObject,
  vi,
} from 'vitest';
import type { AccountID } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.ts';
import { List, type ListID } from '../model/list.ts';
import { RemoveListMemberService } from './removeMember.ts';

describe('RemoveListMemberService', () => {
  const listData = [
    List.reconstruct({
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      id: '10' as ListID,
      memberIds: ['2' as AccountID, '3' as AccountID],
      ownerId: '1' as AccountID,
      publicity: 'PUBLIC',
      title: 'ABC',
    }),
  ];
  const listRepository = new InMemoryListRepository(listData);
  const eventPublisher = {
    publishMany: vi.fn(async () => undefined),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new RemoveListMemberService(listRepository, eventPublisher);

  beforeEach(() => {
    listRepository.reset(listData);
    vi.clearAllMocks();
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
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.member.removed' }),
    ]);
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
