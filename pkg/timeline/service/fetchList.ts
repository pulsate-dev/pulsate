import type { Result } from '@mikuroxina/mini-fn';
import type { List, ListID } from '../model/list.js';
import type { ListRepository } from '../model/repository.js';

export class FetchListService {
  constructor(private readonly listRepository: ListRepository) {
    this.listRepository = listRepository;
  }

  async handle(id: ListID): Promise<Result.Result<Error, List>> {
    return this.listRepository.fetchList(id);
  }
}
