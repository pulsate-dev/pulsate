import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { Medium, MediumID } from '../../model/medium.ts';
import {
  type MediaRepository,
  mediaRepoSymbol,
} from '../../model/repository.ts';

export class InMemoryMediaRepository implements MediaRepository {
  readonly #data: Map<string, Medium> = new Map();

  constructor(media: Medium[]) {
    for (const medium of media) {
      this.#data.set(medium.getId(), medium);
    }
  }

  async create(medium: Medium): Promise<Result.Result<Error, Medium>> {
    this.#data.set(medium.getId(), medium);
    return Result.ok(medium);
  }

  async findByAuthor(authorId: AccountID): Promise<Option.Option<Medium[]>> {
    const res = [...this.#data]
      .filter((m) => m[1].getAuthorId() === authorId)
      .map((v) => v[1]);
    return Option.some(res);
  }

  async findById(id: MediumID): Promise<Option.Option<Medium>> {
    const res = this.#data.get(id);
    if (!res) {
      return Option.none();
    }
    return Option.some(res);
  }
}
export const inMemoryMediaRepo = (media: Medium[]) =>
  Ether.newEther(mediaRepoSymbol, () => new InMemoryMediaRepository(media));
