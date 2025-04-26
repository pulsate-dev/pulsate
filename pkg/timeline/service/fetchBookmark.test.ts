import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { Bookmark } from '../../notes/model/bookmark.js';
import type { NoteID } from '../../notes/model/note.js';
import { InMemoryBookmarkTimelineRepository } from '../adaptor/repository/dummy.js';
import { FetchBookmarkService } from './fetchBookmark.js';

const bookmarks = [
  Bookmark.new({
    accountID: '10' as AccountID,
    noteID: '1' as NoteID,
  }),
  Bookmark.new({
    accountID: '10' as AccountID,
    noteID: '2' as NoteID,
  }),
  Bookmark.new({
    accountID: '20' as AccountID,
    noteID: '3' as NoteID,
  }),
  Bookmark.new({
    accountID: '20' as AccountID,
    noteID: '4' as NoteID,
  }),
  Bookmark.new({
    accountID: '20' as AccountID,
    noteID: '5' as NoteID,
  }),
];

describe('FetchBookmarkService', () => {
  const repo = new InMemoryBookmarkTimelineRepository(bookmarks);
  const service = new FetchBookmarkService(repo);

  it('should fetch bookmarks by accoutID', async () => {
    const res = await service.fetchBookmarkByAccountID('10' as AccountID, {
      hasAttachment: false,
      noNsfw: false,
    });

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([
      bookmarks[1]?.getNoteID(),
      bookmarks[0]?.getNoteID(),
    ]);
    expect(res).toHaveLength(2);
  });

  it('should return when set beforeID', async () => {
    const res = await service.fetchBookmarkByAccountID('20' as AccountID, {
      hasAttachment: false,
      noNsfw: false,
      beforeId: '5' as NoteID,
    });

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([
      bookmarks[3]?.getNoteID(),
      bookmarks[2]?.getNoteID(),
    ]);
    expect(res).toHaveLength(2);
  });
});
