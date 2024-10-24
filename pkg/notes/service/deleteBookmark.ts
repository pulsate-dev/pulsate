import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../model/note.js';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
} from '../model/repository.js';

export class DeleteBookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return await this.bookmarkRepository.deleteByID({ noteID, accountID });
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
