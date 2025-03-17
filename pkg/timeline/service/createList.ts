import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import {
  type Clock,
  type SnowflakeIDGenerator,
  clockSymbol,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import { List } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class CreateListService {
  constructor(
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly listRepository: ListRepository,
    private readonly clock: Clock,
  ) {}

  async handle(
    title: string,
    isPublic: boolean,
    ownerId: AccountID,
  ): Promise<Result.Result<Error, List>> {
    const id = this.idGenerator.generate<List>();
    if (Result.isErr(id)) {
      return id;
    }

    const now = this.clock.now();
    const list = List.new({
      id: Result.unwrap(id),
      title,
      publicity: isPublic ? 'PUBLIC' : 'PRIVATE',
      ownerId,
      memberIds: [] as const,
      createdAt: new Date(Number(now)),
    });

    const res = await this.listRepository.create(list);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(list);
  }
}

export const createListSymbol = Ether.newEtherSymbol<CreateListService>();
export const createList = Ether.newEther(
  createListSymbol,
  ({ idGenerator, listRepository, clock }) =>
    new CreateListService(idGenerator, listRepository, clock),
  {
    idGenerator: snowflakeIDGeneratorSymbol,
    listRepository: listRepoSymbol,
    clock: clockSymbol,
  },
);
