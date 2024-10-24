import { Ether, Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Bookmark } from '../model/bookmark.js';
import type { NoteID } from '../model/note.js';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
} from '../model/repository.js';

export class FetchBookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async fetchBookmarkByID(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Option.Option<Bookmark>> {
    const bookmark = await this.bookmarkRepository.findByID({
      noteID,
      accountID,
    });
    if (Option.isNone(bookmark)) {
      return Option.none();
    }

    return bookmark;
  }

  async fetchBookmarkByAccountID(
    accountID: AccountID,
  ): Promise<Option.Option<Bookmark[]>> {
    const bookmarks = await this.bookmarkRepository.findByAccountID(accountID);

    if (Option.isNone(bookmarks)) {
      return Option.none();
    }

    return bookmarks;
  }
}
export const fetchBookmarkServiceSymbol =
  Ether.newEtherSymbol<FetchBookmarkService>();
export const fetchBookmarkService = Ether.newEther(
  fetchBookmarkServiceSymbol,
  ({ bookmarkRepository }) => new FetchBookmarkService(bookmarkRepository),
  {
    bookmarkRepository: bookmarkRepoSymbol,
  },
);
