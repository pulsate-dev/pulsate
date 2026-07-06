import { Cat, Ether, Promise, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
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
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('id', Promise.resolve(this.idGenerator.generate<List>()))
      .addMWith('list', ({ id }) =>
        Promise.resolve(
          List.new({
            id,
            title,
            publicity: isPublic ? 'PUBLIC' : 'PRIVATE',
            ownerId,
            memberIds: [] as const,
            createdAt: new Date(Number(this.clock.now())),
          }),
        ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.listRepository.create(list)),
      )
      .finish(({ list }) => list);
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
