import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { EventMeta } from '../../internal/event/type.ts';
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
    meta: EventMeta<AccountID>,
  ): Result.Result<Error, Bookmark> {
    const eventRes = bookmarkEventFactory.created(meta.idGenerator, {
      target: arg.noteID,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      accountID: arg.accountID,
    });
    if (Result.isErr(eventRes)) return eventRes;

    const bookmark = new Bookmark(arg);
    bookmark.#events.push(Result.unwrap(eventRes));
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
