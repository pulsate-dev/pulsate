import { Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../id/type.js';
import type { List } from '../model/list.js';
import type { ListRepository } from '../model/repository.js';

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

    try {
      list.setTitle(title);
      const res = await this.listRepository.edit(list);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
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

    try {
      list.setPublicity(publicity);
      const res = await this.listRepository.edit(list);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
}
