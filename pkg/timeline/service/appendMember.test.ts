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
import { generateDummyID, generateDummyIDs } from '../../internal/id/dummy.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import {
  ListNotFoundError,
  ListTooManyMembersError,
  TimelineInsufficientPermissionError,
} from '../model/errors.ts';
import type { List } from '../model/list.ts';
import { generateDummyList } from '../testData/testData.ts';
import { AppendListMemberService } from './appendMember.ts';

describe('AppendListMemberService', () => {
  const ownerId = generateDummyID<Account>();
  const listId = generateDummyID<List>();
  const createListData = () => [
    generateDummyList({ id: listId, ownerId, title: 'ABC' }),
  ];
  const listRepository = new InMemoryListRepository(createListData());
  const eventPublisher = {
    publishMany: vi.fn(async () => Result.ok(undefined)),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new AppendListMemberService(listRepository, eventPublisher);
  const newMemberId = generateDummyID<Account>();

  beforeEach(() => {
    listRepository.reset(createListData());
    vi.clearAllMocks();
  });

  it('should append member to list', async () => {
    const res = await service.handle(listId, newMemberId, ownerId);

    expect(Result.isErr(res)).toBe(false);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.member.appended' }),
    ]);
  });

  it("should return error if list doesn't exist", async () => {
    const res = await service.handle(
      generateDummyID<List>(),
      newMemberId,
      ownerId,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListNotFoundError);
  });

  it('should return error if member already exists', async () => {
    await service.handle(listId, newMemberId, ownerId);
    const res = await service.handle(listId, newMemberId, ownerId);

    expect(Result.isErr(res)).toBe(true);
  });

  it('should not append member if member count exceeds the limit (250)', async () => {
    const testData = generateDummyIDs<Account>(250);
    for (const v of testData) {
      await service.handle(listId, v, ownerId);
    }

    const res = await service.handle(listId, newMemberId, ownerId);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTooManyMembersError);
  });

  it('should error if actor is not list owner', async () => {
    const res = await service.handle(
      listId,
      newMemberId,
      generateDummyID<Account>(),
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(
      TimelineInsufficientPermissionError,
    );
  });
});
