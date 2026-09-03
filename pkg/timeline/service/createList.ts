import { Cat, Ether, Promise, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import { List } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class CreateListService {
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #listRepository: ListRepository;
  readonly #clock: Clock;
  constructor(
    idGenerator: SnowflakeIDGenerator,
    listRepository: ListRepository,
    clock: Clock,
  ) {
    this.#idGenerator = idGenerator;
    this.#listRepository = listRepository;
    this.#clock = clock;
  }

  async handle(
    title: string,
    isPublic: boolean,
    ownerId: AccountID,
  ): Promise<Result.Result<Error, List>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('id', Promise.resolve(this.#idGenerator.generate<List>()))
      .addMWith('list', ({ id }) =>
        Promise.resolve(
          List.new(
            {
              id,
              title,
              publicity: isPublic ? 'PUBLIC' : 'PRIVATE',
              ownerId,
              memberIds: [] as const,
              createdAt: new Date(Number(this.#clock.now())),
            },
            {
              idGenerator: this.#idGenerator,
              actor: ownerId,
              occurredAt: new Date(Number(this.#clock.now())),
            },
          ),
        ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.#listRepository.create(list)),
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
