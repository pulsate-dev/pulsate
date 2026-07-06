import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import {
  NoteBookmarkAlreadyCreatedError,
  NoteNotFoundError,
} from '../model/errors.js';
import type { Note, NoteID } from '../model/note.js';
import {
  type BookmarkRepository,
  bookmarkRepoSymbol,
  type NoteRepository,
  noteRepoSymbol,
} from '../model/repository.js';

export class CreateBookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, Note>> {
    return Cat.doT(resultPromiseMonad<Error>())
      .addM(
        'result',
        this.noteRepository
          .findByID(noteID)
          .then(
            Option.okOrElse(
              () => new NoteNotFoundError('Note not found', { cause: null }),
            ),
          ),
      )
      .runWith(() =>
        this.bookmarkRepository
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
        this.bookmarkRepository
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
