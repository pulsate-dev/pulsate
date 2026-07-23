import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
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
  constructor(
    bookmarkRepository: BookmarkRepository,
    noteRepository: NoteRepository,
  ) {
    this.#bookmarkRepository = bookmarkRepository;
    this.#noteRepository = noteRepository;
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
  ({ bookmarkRepository, noteRepository }) =>
    new CreateBookmarkService(bookmarkRepository, noteRepository),
  {
    bookmarkRepository: bookmarkRepoSymbol,
    noteRepository: noteRepoSymbol,
  },
);
