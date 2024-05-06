import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import type { Bookmark } from '../../model/bookmark.js';
import type { NoteID } from '../../model/note.js';
import type { CreateBookmarkService } from '../../service/createBookmark.js';
import type { DeleteBookmarkService } from '../../service/deleteBookmark.js';
import type { FetchBookmarkService } from '../../service/fetchBookmark.js';

export class BookmarkController {
  constructor(
    private readonly createBookmarkService: CreateBookmarkService,
    private readonly fetchBookmarkService: FetchBookmarkService,
    private readonly deleteBookmarkService: DeleteBookmarkService,
  ) {}

  async createBookmark(
    noteID: string,
    accountID: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.createBookmarkService.handle(
      noteID as ID<NoteID>,
      accountID as ID<AccountID>,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async getBookmarkByID(
    noteID: string,
    accountID: string,
  ): Promise<Option.Option<Bookmark>> {
    const res = await this.fetchBookmarkService.fetchBookmarkByID(
      noteID as ID<NoteID>,
      accountID as ID<AccountID>,
    );

    return res;
  }

  async getBookmarkByAccountID(
    accountID: string,
  ): Promise<Option.Option<Bookmark[]>> {
    const res = await this.fetchBookmarkService.fetchBookmarkByAccountID(
      accountID as ID<AccountID>,
    );

    return res;
  }

  async deleteBookmark(
    noteID: string,
    accountID: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.deleteBookmarkService.handle(
      noteID as ID<NoteID>,
      accountID as ID<AccountID>,
    );

    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }
}
