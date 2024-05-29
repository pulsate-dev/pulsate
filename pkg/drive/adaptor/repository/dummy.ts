import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import { type Medium, type MediumID } from '../../model/medium.js';
import type { MediaRepository } from '../../model/repository.js';

export class InMemoryMediaRepository implements MediaRepository {
  private readonly data: Set<Medium> = new Set();

  async create(medium: Medium): Promise<Result.Result<Error, void>> {
    this.data.add(medium);
    return Result.ok(undefined);
  }

  async findByAuthor(
    authorId: ID<AccountID>,
  ): Promise<Option.Option<Medium[]>> {
    const res = [...this.data].filter((m) => m.getAuthorId() === authorId);
    return Option.some(res);
  }

  async findById(id: ID<MediumID>): Promise<Option.Option<Medium>> {
    const res = [...this.data].find((m) => m.getId() === id);
    if (!res) {
      return Option.none();
    }
    return Option.some(res);
  }
}
