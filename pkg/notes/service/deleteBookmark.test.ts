import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { InMemoryBookmarkRepository } from '../adaptor/repository/dummy.js';
import { Bookmark } from '../model/bookmark.js';
import type { NoteID } from '../model/note.js';
import { DeleteBookmarkService } from './deleteBookmark.js';

const noteID = '1' as ID<NoteID>;
const accountID = '1' as AccountID;

const bookmarkRepository = new InMemoryBookmarkRepository([
  Bookmark.new({ noteID, accountID }),
]);
const deleteBookmarkService = new DeleteBookmarkService(bookmarkRepository);

describe('DeleteBookmarkService', () => {
  it('should delete bookmark', async () => {
    const res = await deleteBookmarkService.handle(noteID, accountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('should fail to delete bookmark when does not exist bookmark', async () => {
    const res = await deleteBookmarkService.handle(
      'notExistNoteID' as ID<NoteID>,
      accountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });
});
