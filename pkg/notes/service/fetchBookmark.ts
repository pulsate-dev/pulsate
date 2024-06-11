import { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Bookmark } from '../model/bookmark.js';
import type { NoteID } from '../model/note.js';
import type { BookmarkRepository } from '../model/repository.js';

export class FetchBookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async fetchBookmarkByID(
    noteID: ID<NoteID>,
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
