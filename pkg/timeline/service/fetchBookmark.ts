import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note, NoteID } from '../../notes/model/note.js';
import {
  type BookmarkTimelineFilter,
  type BookmarkTimelineRepository,
  bookmarkTimelineRepoSymbol,
  type TimelineRepository,
  timelineRepoSymbol,
} from '../model/repository.js';

export class FetchBookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkTimelineRepository,
    private readonly timelineRepository: TimelineRepository,
  ) {}

  async fetchBookmarkByAccountID(
    accountID: AccountID,
    filter: BookmarkTimelineFilter,
  ): Promise<Result.Result<Error, NoteID[]>> {
    return await this.bookmarkRepository.findByAccountID(accountID, filter);
  }

  async fetchBookmarkNotes(
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    // NOTE: This function is simply used to fetch multiple posts by retrieving Notes from the IDs obtained in fetchBookmarkByAccountID.
    return await this.timelineRepository.getHomeTimeline(noteIDs, {
      hasAttachment: false,
      noNsfw: false,
    });
  }
}
export const fetchBookmarkServiceSymbol =
  Ether.newEtherSymbol<FetchBookmarkService>();
export const fetchBookmark = Ether.newEther(
  fetchBookmarkServiceSymbol,
  ({ bookmarkRepository, timelineRepository }) =>
    new FetchBookmarkService(bookmarkRepository, timelineRepository),
  {
    bookmarkRepository: bookmarkTimelineRepoSymbol,
    timelineRepository: timelineRepoSymbol,
  },
);
