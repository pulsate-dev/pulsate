import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { NoteID } from '../model/note.ts';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
} from '../model/repository.ts';

export class DeleteBookmarkService {
  readonly #bookmarkRepository: BookmarkRepository;
  constructor(bookmarkRepository: BookmarkRepository) {
    this.#bookmarkRepository = bookmarkRepository;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return await this.#bookmarkRepository.deleteByID({ noteID, accountID });
  }
}
export const deleteBookmarkServiceSymbol =
  Ether.newEtherSymbol<DeleteBookmarkService>();
export const deleteBookmarkService = Ether.newEther(
  deleteBookmarkServiceSymbol,
  ({ bookmarkRepository }) => new DeleteBookmarkService(bookmarkRepository),
  {
    bookmarkRepository: bookmarkRepoSymbol,
  },
);
