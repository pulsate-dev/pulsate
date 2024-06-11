import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { Bookmark, type CreateBookmarkArgs } from './bookmark.js';
import { type NoteID } from './note.js';

const exampleInput: CreateBookmarkArgs = {
  noteID: '1' as ID<NoteID>,
  accountID: '2' as AccountID,
};

describe('Bookmark', () => {
  it('add note to bookmark', () => {
    const bookmark = Bookmark.new(exampleInput);

    expect(bookmark.getNoteID()).toBe(exampleInput.noteID);
    expect(bookmark.getAccountID()).toBe(exampleInput.accountID);
  });
});
