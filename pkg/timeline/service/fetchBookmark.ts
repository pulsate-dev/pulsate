import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Bookmark } from '../../notes/model/bookmark.js';
import {
  type BookmarkTimelineFilter,
  type BookmarkTimelineRepository,
  bookmarkTimelineRepoSymbol,
} from '../model/repository.js';

export class FetchBookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkTimelineRepository,
  ) {}

  async fetchBookmarkByAccountID(
    accountID: AccountID,
    filter: BookmarkTimelineFilter,
  ): Promise<Result.Result<Error, Bookmark[]>> {
    const bookmarks = await this.bookmarkRepository.findByAccountID(
      accountID,
      filter,
    );

    return bookmarks;
  }
}
export const fetchBookmarkServiceSymbol =
  Ether.newEtherSymbol<FetchBookmarkService>();
export const fetchBookmarkService = Ether.newEther(
  fetchBookmarkServiceSymbol,
  ({ bookmarkRepository }) => new FetchBookmarkService(bookmarkRepository),
  {
    bookmarkRepository: bookmarkTimelineRepoSymbol,
  },
);
