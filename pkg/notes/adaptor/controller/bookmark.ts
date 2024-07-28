import type { z } from '@hono/zod-openapi';
import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Bookmark } from '../../model/bookmark.js';
import type { NoteID } from '../../model/note.js';
import type { CreateBookmarkService } from '../../service/createBookmark.js';
import type { DeleteBookmarkService } from '../../service/deleteBookmark.js';
import type { FetchBookmarkService } from '../../service/fetchBookmark.js';
import type { CreateBookmarkResponseSchema } from '../validator/schema.js';

export class BookmarkController {
  constructor(
    private readonly createBookmarkService: CreateBookmarkService,
    private readonly fetchBookmarkService: FetchBookmarkService,
    private readonly deleteBookmarkService: DeleteBookmarkService,
  ) {}

  async createBookmark(
    noteID: string,
    accountID: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof CreateBookmarkResponseSchema>>
  > {
    const res = await this.createBookmarkService.handle(
      noteID as NoteID,
      accountID as AccountID,
    );

    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      content: res[1].getContent(),
      visibility: res[1].getVisibility(),
      contents_warning_comment: res[1].getCwComment(),
      author_id: res[1].getAuthorID(),
      created_at: res[1].getCreatedAt().toUTCString(),
    });
  }

  // ToDo: add pagination, impl handler function
  async getBookmarkByID(
    noteID: string,
    accountID: string,
  ): Promise<Option.Option<Bookmark>> {
    const res = await this.fetchBookmarkService.fetchBookmarkByID(
      noteID as NoteID,
      accountID as AccountID,
    );

    return res;
  }

  // ToDo: impl handler function
  async getBookmarkByAccountID(
    accountID: string,
  ): Promise<Option.Option<Bookmark[]>> {
    const res = await this.fetchBookmarkService.fetchBookmarkByAccountID(
      accountID as AccountID,
    );

    return res;
  }

  async deleteBookmark(
    noteID: string,
    accountID: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.deleteBookmarkService.handle(
      noteID as NoteID,
      accountID as AccountID,
    );

    return Result.map(() => undefined)(res);
  }
}
