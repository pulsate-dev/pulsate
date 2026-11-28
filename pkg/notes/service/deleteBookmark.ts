import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import {
  NoteBookmarkNotFoundError,
  NoteNotFoundError,
} from '../model/errors.ts';
import type { NoteID } from '../model/note.ts';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
  type NoteRepository,
  noteRepoSymbol,
} from '../model/repository.ts';

export class DeleteBookmarkService {
  readonly #bookmarkRepository: BookmarkRepository;
  readonly #noteRepository: NoteRepository;
  readonly #eventPublisher: EventPublisher;
  constructor(
    bookmarkRepository: BookmarkRepository,
    noteRepository: NoteRepository,
    eventPublisher: EventPublisher,
  ) {
    this.#bookmarkRepository = bookmarkRepository;
    this.#noteRepository = noteRepository;
    this.#eventPublisher = eventPublisher;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM(
        'note',
        this.#noteRepository
          .findByID(noteID)
          .then(
            Option.okOrElse(
              () => new NoteNotFoundError('Note not found', { cause: null }),
            ),
          ),
      )
      .addMWith('bookmark', () =>
        this.#bookmarkRepository.findByID({ noteID, accountID }).then(
          Option.okOrElse(
            () =>
              new NoteBookmarkNotFoundError('bookmark not found', {
                cause: null,
              }),
          ),
        ),
      )
      .runWith(({ bookmark }) =>
        this.#bookmarkRepository
          .deleteByID({
            noteID: bookmark.getNoteID(),
            accountID: bookmark.getAccountID(),
          })
          .then(Result.map(() => [])),
      )
      .runWith(({ bookmark }) => {
        bookmark.deleted(accountID);
        return Promise.resultMonad<Error>().map(() => [])(
          this.#eventPublisher.publishMany(bookmark.pullEvents()),
        );
      })
      .finish(() => undefined);
  }
}
export const deleteBookmarkServiceSymbol =
  Ether.newEtherSymbol<DeleteBookmarkService>();
export const deleteBookmarkService = Ether.newEther(
  deleteBookmarkServiceSymbol,
  ({ bookmarkRepository, noteRepository, eventPublisher }) =>
    new DeleteBookmarkService(
      bookmarkRepository,
      noteRepository,
      eventPublisher,
    ),
  {
    bookmarkRepository: bookmarkRepoSymbol,
    noteRepository: noteRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
