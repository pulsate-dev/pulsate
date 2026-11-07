import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryListRepository } from '../adaptor/repository/dummy.ts';
import type { List } from '../model/list.ts';
import { generateDummyList } from '../testData/testData.ts';
import { FetchListService } from './fetchList.ts';

const testList = generateDummyList();
const repository = new InMemoryListRepository([testList]);
const service = new FetchListService(repository);

describe('FetchListService', () => {
  it('get existing list', async () => {
    const res = await service.handle(testList.getId());
    expect(Result.isOk(res)).toBe(true);
  });
  it('error when not exiting list', async () => {
    const res = await service.handle(generateDummyID<List>());
    expect(Result.isErr(res)).toBe(true);
  });
});
