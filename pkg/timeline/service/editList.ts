import { Cat, Ether, Promise, type Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../internal/id/type.ts';
import type { List } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class EditListService {
  readonly #listRepository: ListRepository;
  constructor(listRepository: ListRepository) {
    this.#listRepository = listRepository;
  }

  async editTitle(
    listId: ID<List>,
    title: string,
  ): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('list', this.#listRepository.fetchList(listId))
      .runWith(({ list }) =>
        monad.map(() => [])(Promise.resolve(list.setTitle(title))),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.#listRepository.edit(list)),
      )
      .finish(() => undefined);
  }
  async editPublicity(
    listId: ID<List>,
    publicity: 'PUBLIC' | 'PRIVATE',
  ): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('list', this.#listRepository.fetchList(listId))
      .runWith(({ list }) =>
        monad.map(() => [])(
          Promise.resolve(
            publicity === 'PUBLIC' ? list.toPublic() : list.toPrivate(),
          ),
        ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.#listRepository.edit(list)),
      )
      .finish(() => undefined);
  }
}

export const editListSymbol = Ether.newEtherSymbol<EditListService>();
export const editList = Ether.newEther(
  editListSymbol,
  ({ listRepository }) => new EditListService(listRepository),
  {
    listRepository: listRepoSymbol,
  },
);
