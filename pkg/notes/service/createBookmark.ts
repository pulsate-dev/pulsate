import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
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
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #clock: Clock;
  constructor(
    bookmarkRepository: BookmarkRepository,
    noteRepository: NoteRepository,
    idGenerator: SnowflakeIDGenerator,
    clock: Clock,
  ) {
    this.#bookmarkRepository = bookmarkRepository;
    this.#noteRepository = noteRepository;
    this.#idGenerator = idGenerator;
    this.#clock = clock;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, Note>> {
    const now = this.#clock.now();

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
        Promise.resolve(
          Bookmark.new(
            { noteID, accountID },
            {
              idGenerator: this.#idGenerator,
              actor: accountID,
              occurredAt: new Date(Number(now)),
            },
          ),
        ),
      )
      .runWith(() =>
        this.#bookmarkRepository
          .create({ noteID, accountID })
          .then(Result.map(() => [])),
      )
      .finish(({ result }) => result);
  }
}

export const createBookmarkSymbol =
  Ether.newEtherSymbol<CreateBookmarkService>();
export const createBookmark = Ether.newEther(
  createBookmarkSymbol,
  ({ bookmarkRepository, noteRepository, idGenerator, clock }) =>
    new CreateBookmarkService(
      bookmarkRepository,
      noteRepository,
      idGenerator,
      clock,
    ),
  {
    bookmarkRepository: bookmarkRepoSymbol,
    noteRepository: noteRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    clock: clockSymbol,
  },
);
