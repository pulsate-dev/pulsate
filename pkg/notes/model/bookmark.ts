import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  type BookmarkEvent,
  bookmarkEventFactory,
} from './event/bookmarkEvents.ts';
import type { NoteID } from './note.ts';

export interface CreateBookmarkArgs {
  noteID: NoteID;
  accountID: AccountID;
}

export class Bookmark {
  readonly #noteID: NoteID;
  readonly #accountID: AccountID;
  #events: BookmarkEvent[] = [];

  private constructor(arg: CreateBookmarkArgs) {
    this.#noteID = arg.noteID;
    this.#accountID = arg.accountID;
  }

  static new(
    arg: CreateBookmarkArgs,
    actor: AccountID,
  ): Result.Result<never, Bookmark> {
    const bookmark = new Bookmark(arg);
    bookmark.#events.push(
      bookmarkEventFactory.created({
        target: arg.noteID,
        actor,
        accountID: arg.accountID,
      }),
    );
    return Result.ok(bookmark);
  }

  static reconstruct(arg: CreateBookmarkArgs): Bookmark {
    return new Bookmark(arg);
  }

  pullEvents(): BookmarkEvent[] {
    return this.#events.splice(0);
  }

  getNoteID(): NoteID {
    return this.#noteID;
  }

  getAccountID(): AccountID {
    return this.#accountID;
  }
}
