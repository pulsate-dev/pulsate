import { Ether, Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../id/type.js';
import type { List } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class DeleteListService {
  constructor(private readonly listRepository: ListRepository) {}

  async handle(listId: ID<List>): Promise<Result.Result<Error, void>> {
    const res = await this.listRepository.deleteById(listId);

    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }
}
export const deleteListSymbol = Ether.newEtherSymbol<DeleteListService>();
export const deleteList = Ether.newEther(
  deleteListSymbol,
  ({ listRepository }) => new DeleteListService(listRepository),
  {
    listRepository: listRepoSymbol,
  },
);
