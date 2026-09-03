import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { InMemoryBookmarkRepository } from '../adaptor/repository/dummy.ts';
import { Bookmark } from '../model/bookmark.ts';
import type { NoteID } from '../model/note.ts';
import { DeleteBookmarkService } from './deleteBookmark.ts';

const noteID = '1' as NoteID;
const accountID = '1' as AccountID;

const bookmarkRepository = new InMemoryBookmarkRepository([
  Bookmark.reconstruct({ noteID, accountID }),
]);
const deleteBookmarkService = new DeleteBookmarkService(bookmarkRepository);

describe('DeleteBookmarkService', () => {
  it('should delete bookmark', async () => {
    const res = await deleteBookmarkService.handle(noteID, accountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should fail to delete bookmark when does not exist bookmark', async () => {
    const res = await deleteBookmarkService.handle(
      'notExistNoteID' as NoteID,
      accountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });
});
