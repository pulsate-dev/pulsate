import { Result } from '@mikuroxina/mini-fn';
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedObject,
  vi,
} from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.ts';
import type { List } from '../model/list.ts';
import { generateDummyList } from '../testData/testData.ts';
import { RemoveListMemberService } from './removeMember.ts';

describe('RemoveListMemberService', () => {
  const ownerId = generateDummyID<Account>();
  const memberId = generateDummyID<Account>();
  const otherMemberId = generateDummyID<Account>();
  const listId = generateDummyID<List>();
  const listData = [
    generateDummyList({
      id: listId,
      ownerId,
      memberIds: [memberId, otherMemberId],
      title: 'ABC',
    }),
  ];
  const listRepository = new InMemoryListRepository(listData);
  const eventPublisher = {
    publishMany: vi.fn(async () => Result.ok(undefined)),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new RemoveListMemberService(listRepository, eventPublisher);

  beforeEach(() => {
    listRepository.reset(listData);
    vi.clearAllMocks();
  });

  it('should remove member from list', async () => {
    const res = await service.handle(listId, memberId, ownerId);
    const listRes = await listRepository.fetchListMembers(listId);

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(listRes)).toHaveLength(1);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.member.removed' }),
    ]);
  });

  it("should return error if list doesn't exist", async () => {
    const res = await service.handle(
      generateDummyID<List>(),
      generateDummyID<Account>(),
      ownerId,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListNotFoundError);
  });

  it('should return error if actor does not own the list', async () => {
    const res = await service.handle(listId, memberId, memberId);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      TimelineInsufficientPermissionError,
    );
  });
});
