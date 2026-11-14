import { Ether, type Result } from '@mikuroxina/mini-fn';
import type { List, ListID } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class FetchListService {
  readonly #listRepository: ListRepository;
  constructor(listRepository: ListRepository) {
    this.#listRepository = listRepository;
    this.#listRepository = listRepository;
  }

  async handle(id: ListID): Promise<Result.Result<Error, List>> {
    return this.#listRepository.fetchList(id);
  }
}
export const fetchListSymbol = Ether.newEtherSymbol<FetchListService>();
export const fetchList = Ether.newEther(
  fetchListSymbol,
  ({ listRepository }) => new FetchListService(listRepository),
  {
    listRepository: listRepoSymbol,
  },
);
