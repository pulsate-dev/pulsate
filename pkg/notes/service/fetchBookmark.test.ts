import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryBookmarkRepository } from '../adaptor/repository/dummy.js';
import { Bookmark } from '../model/bookmark.js';
import type { NoteID } from '../model/note.js';
import { FetchBookmarkService } from './fetchBookmark.js';

const bookmarkRepository = new InMemoryBookmarkRepository([
  Bookmark.new({
    noteID: '1' as NoteID,
    accountID: '10' as AccountID,
  }),
  Bookmark.new({
    noteID: '2' as NoteID,
    accountID: '10' as AccountID,
  }),
  Bookmark.new({
    noteID: '2' as NoteID,
    accountID: '20' as AccountID,
  }),
]);
const fetchBookmarkService = new FetchBookmarkService(bookmarkRepository);

describe('FetchBookmarkService', () => {
  it('should fetch bookmark', async () => {
    const res = await fetchBookmarkService.fetchBookmarkByID(
      '1' as NoteID,
      '10' as AccountID,
    );
    expect(Option.isSome(res)).toBe(true);
  });

  it('should fetch bookmarks by AccountID', async () => {
    const res = await fetchBookmarkService.fetchBookmarkByAccountID(
      '10' as AccountID,
    );
    expect(Option.isSome(res)).toBe(true);
    expect(Option.unwrap(res).length).toBe(2);
  });

  it('bookmark not found', async () => {
    const res = await fetchBookmarkService.fetchBookmarkByID(
      '42' as NoteID,
      '10' as AccountID,
    );
    expect(Option.isNone(res)).toBe(true);
  });
});
