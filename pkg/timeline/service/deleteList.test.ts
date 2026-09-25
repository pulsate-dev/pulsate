import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { AccountID } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import { List, type ListID } from '../model/list.ts';
import { DeleteListService } from './deleteList.ts';

const testList = List.reconstruct({
  id: '1' as ListID,
  createdAt: new Date('2023-10-10T00:00:00Z'),
  memberIds: [],
  ownerId: '' as AccountID,
  publicity: 'PUBLIC',
  title: 'Test List',
});

describe('DeleteListService', () => {
  const repository = new InMemoryListRepository([testList]);
  const eventPublisher = {
    publishMany: vi.fn(async () => undefined),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new DeleteListService(repository, eventPublisher);

  it('should delete a list', async () => {
    const res = await service.handle('1' as ListID);

    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.deleted' }),
    ]);
  });
  it('should be error when try delete not existing list', async () => {
    const res = await service.handle('2' as ListID);

    expect(Result.isErr(res)).toBe(true);
  });
});
