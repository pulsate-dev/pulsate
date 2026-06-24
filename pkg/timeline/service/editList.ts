import { Ether, Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../internal/id/type.js';
import type { List } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class EditListService {
  constructor(private readonly listRepository: ListRepository) {}

  async editTitle(
    listId: ID<List>,
    title: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.listRepository.fetchList(listId);
    if (Result.isErr(res)) {
      return res;
    }

    const list = Result.unwrap(res);

    const setTitleRes = list.setTitle(title);
    if (Result.isErr(setTitleRes)) {
      return setTitleRes;
    }

    return await this.listRepository.edit(list);
  }
  async editPublicity(
    listId: ID<List>,
    publicity: 'PUBLIC' | 'PRIVATE',
  ): Promise<Result.Result<Error, void>> {
    const res = await this.listRepository.fetchList(listId);
    if (Result.isErr(res)) {
      return res;
    }

    const list = Result.unwrap(res);

    const setPublicityRes =
      publicity === 'PUBLIC' ? list.toPublic() : list.toPrivate();
    if (Result.isErr(setPublicityRes)) {
      return setPublicityRes;
    }

    return await this.listRepository.edit(list);
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
