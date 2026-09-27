import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import { Bookmark } from '../model/bookmark.ts';
import type { NoteID } from '../model/note.ts';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
} from '../model/repository.ts';

export class DeleteBookmarkService {
  readonly #bookmarkRepository: BookmarkRepository;
  readonly #eventPublisher: EventPublisher;
  constructor(
    bookmarkRepository: BookmarkRepository,
    eventPublisher: EventPublisher,
  ) {
    this.#bookmarkRepository = bookmarkRepository;
    this.#eventPublisher = eventPublisher;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const bookmark = Bookmark.reconstruct({ noteID, accountID });
    bookmark.deleted();

    const res = await this.#bookmarkRepository.deleteByID({
      noteID,
      accountID,
    });
    if (Result.isErr(res)) {
      return res;
    }

    await this.#eventPublisher.publishMany(bookmark.pullEvents());
    return Result.ok(undefined);
  }
}
export const deleteBookmarkServiceSymbol =
  Ether.newEtherSymbol<DeleteBookmarkService>();
export const deleteBookmarkService = Ether.newEther(
  deleteBookmarkServiceSymbol,
  ({ bookmarkRepository, eventPublisher }) =>
    new DeleteBookmarkService(bookmarkRepository, eventPublisher),
  {
    bookmarkRepository: bookmarkRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
