import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import { List } from '../model/list.js';
import type { ListRepository } from '../model/repository.js';

export class CreateListService {
  constructor(
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly listRepository: ListRepository,
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

    const list = List.new({
      id: id[1],
      title,
      publicity: isPublic ? 'PUBLIC' : 'PRIVATE',
      ownerId,
      memberIds: [] as const,
      createdAt: new Date(),
    });

    const res = await this.listRepository.create(list);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(list);
  }
}
