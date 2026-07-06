import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../internal/id/type.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { List } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class EditListService {
  constructor(private readonly listRepository: ListRepository) {}

  async editTitle(
    listId: ID<List>,
    title: string,
  ): Promise<Result.Result<Error, void>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('list', this.listRepository.fetchList(listId))
      .runWith(({ list }) =>
        Promise.resolve(list.setTitle(title)).then(Result.map(() => [])),
      )
      .runWith(({ list }) =>
        this.listRepository.edit(list).then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }
  async editPublicity(
    listId: ID<List>,
    publicity: 'PUBLIC' | 'PRIVATE',
  ): Promise<Result.Result<Error, void>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('list', this.listRepository.fetchList(listId))
      .runWith(({ list }) =>
        Promise.resolve(
          publicity === 'PUBLIC' ? list.toPublic() : list.toPrivate(),
        ).then(Result.map(() => [])),
      )
      .runWith(({ list }) =>
        this.listRepository.edit(list).then(Result.map(() => [])),
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
