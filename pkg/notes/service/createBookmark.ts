import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { NoteID } from '../model/note.js';
import type { BookmarkRepository } from '../model/repository.js';

export class CreateBookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async handle(
    noteID: ID<NoteID>,
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, void>> {
    const existBookmark = await this.bookmarkRepository.findByID({
      noteID,
      accountID,
    });

    if (Option.isSome(existBookmark)) {
      return Result.err(new Error('bookmark has already created'));
    }

    return await this.bookmarkRepository.create({ noteID, accountID });
  }
}
