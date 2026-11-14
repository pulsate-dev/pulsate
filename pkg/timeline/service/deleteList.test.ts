import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import type { List } from '../model/list.ts';
import { generateDummyList } from '../testData/testData.ts';
import { DeleteListService } from './deleteList.ts';

const testList = generateDummyList();

describe('DeleteListService', () => {
  const repository = new InMemoryListRepository([testList]);
  const eventPublisher = {
    publishMany: vi.fn(async () => Result.ok(undefined)),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new DeleteListService(repository, eventPublisher);

  it('should delete a list', async () => {
    const res = await service.handle(testList.getId());

    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'list.deleted' }),
    ]);
  });
  it('should be error when try delete not existing list', async () => {
    const res = await service.handle(generateDummyID<List>());

    expect(Result.isErr(res)).toBe(true);
  });
});
