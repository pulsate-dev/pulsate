import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import { Bookmark } from '../model/bookmark.ts';
import {
  NoteBookmarkAlreadyCreatedError,
  NoteNotFoundError,
} from '../model/errors.ts';
import type { Note, NoteID } from '../model/note.ts';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
  type NoteRepository,
  noteRepoSymbol,
} from '../model/repository.ts';

export class CreateBookmarkService {
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
  ): Promise<Result.Result<Error, Note>> {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM(
        'result',
        this.#noteRepository
          .findByID(noteID)
          .then(
            Option.okOrElse(
              () => new NoteNotFoundError('Note not found', { cause: null }),
            ),
          ),
      )
      .runWith(() =>
        this.#bookmarkRepository
          .findByID({ noteID, accountID })
          .then(
            Option.mapOrElse<Result.Result<Error, never[]>>(() =>
              Result.ok([]),
            )(() =>
              Result.err(
                new NoteBookmarkAlreadyCreatedError(
                  'bookmark has already created',
                  { cause: null },
                ),
              ),
            ),
          ),
      )
      .addMWith('bookmark', () =>
        Promise.resolve(Bookmark.new({ noteID, accountID }, accountID)),
      )
      .runWith(() =>
        this.#bookmarkRepository
          .create({ noteID, accountID })
          .then(Result.map(() => [])),
      )
      .runWith(({ bookmark }) => {
        this.#eventPublisher.publishMany(bookmark.pullEvents());
        return Promise.resolve(Result.ok([]));
      })
      .finish(({ result }) => result);
  }
}

export const createBookmarkSymbol =
  Ether.newEtherSymbol<CreateBookmarkService>();
export const createBookmark = Ether.newEther(
  createBookmarkSymbol,
  ({ bookmarkRepository, noteRepository, eventPublisher }) =>
    new CreateBookmarkService(
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
