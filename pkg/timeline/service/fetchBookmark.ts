import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { Note, NoteID } from '../../notes/model/note.ts';
import {
  type BookmarkTimelineFilter,
  type BookmarkTimelineRepository,
  bookmarkTimelineRepoSymbol,
  type TimelineRepository,
  timelineRepoSymbol,
} from '../model/repository.ts';

export class FetchBookmarkService {
  readonly #bookmarkRepository: BookmarkTimelineRepository;
  readonly #timelineRepository: TimelineRepository;
  constructor(
    bookmarkRepository: BookmarkTimelineRepository,
    timelineRepository: TimelineRepository,
  ) {
    this.#bookmarkRepository = bookmarkRepository;
    this.#timelineRepository = timelineRepository;
  }

  async fetchBookmarkByAccountID(
    accountID: AccountID,
    filter: BookmarkTimelineFilter,
  ): Promise<Result.Result<Error, NoteID[]>> {
    return await this.#bookmarkRepository.findByAccountID(accountID, filter);
  }

  async fetchBookmarkNotes(
    noteIDs: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    // NOTE: This function is simply used to fetch multiple posts by retrieving Notes from the IDs obtained in fetchBookmarkByAccountID.
    return await this.#timelineRepository
      .getHomeTimeline(noteIDs, {
        hasAttachment: false,
        noNsfw: false,
      })
      .then(
        Result.map((notes) => {
          const notesByID = new Map(notes.map((note) => [note.getID(), note]));
          return noteIDs.flatMap((id) => {
            const note = notesByID.get(id);
            return note ? [note] : [];
          });
        }),
      );
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
