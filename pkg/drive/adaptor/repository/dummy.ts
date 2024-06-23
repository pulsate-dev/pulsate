import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import { type Medium, type MediumID } from '../../model/medium.js';
import type { MediaRepository } from '../../model/repository.js';

export class InMemoryMediaRepository implements MediaRepository {
  private readonly data: Map<string, Medium> = new Map();

  async create(medium: Medium): Promise<Result.Result<Error, void>> {
    this.data.set(medium.getId(), medium);
    return Result.ok(undefined);
  }

  async findByAuthor(authorId: AccountID): Promise<Option.Option<Medium[]>> {
    const res = [...this.data]
      .filter((m) => m[1].getAuthorId() === authorId)
      .map((v) => v[1]);
    return Option.some(res);
  }

  async findById(id: MediumID): Promise<Option.Option<Medium>> {
    const res = this.data.get(id);
    if (!res) {
      return Option.none();
    }
    return Option.some(res);
  }
}
