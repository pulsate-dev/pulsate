import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { DUMMY_BASE_DATE } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { Bookmark } from '../../notes/model/bookmark.ts';
import { generateDummyNote } from '../../notes/testData/testData.ts';
import {
  InMemoryBookmarkTimelineRepository,
  InMemoryTimelineRepository,
} from '../adaptor/repository/dummy.ts';
import { FetchBookmarkService } from './fetchBookmark.ts';

const accountA = generateDummyAccount().getID();
const accountB = generateDummyAccount().getID();
const bookmarkedNote = (seconds: number) =>
  generateDummyNote({
    createdAt: addDuration(DUMMY_BASE_DATE, { seconds }),
  }).getID();
const bookmarks = [
  Bookmark.reconstruct({ accountID: accountA, noteID: bookmarkedNote(0) }),
  Bookmark.reconstruct({ accountID: accountA, noteID: bookmarkedNote(1) }),
  Bookmark.reconstruct({ accountID: accountB, noteID: bookmarkedNote(2) }),
  Bookmark.reconstruct({ accountID: accountB, noteID: bookmarkedNote(3) }),
  Bookmark.reconstruct({ accountID: accountB, noteID: bookmarkedNote(4) }),
];

describe('FetchBookmarkService', () => {
  const repo = new InMemoryBookmarkTimelineRepository(bookmarks);
  const timelineRepo = new InMemoryTimelineRepository();
  const service = new FetchBookmarkService(repo, timelineRepo);

  it('should fetch bookmarks by accountID', async () => {
    const res = await service.fetchBookmarkByAccountID(accountA, {
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
    const res = await service.fetchBookmarkByAccountID(accountB, {
      hasAttachment: false,
      noNsfw: false,
      beforeId: bookmarks[4]?.getNoteID(),
    });

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([
      bookmarks[3]?.getNoteID(),
      bookmarks[2]?.getNoteID(),
    ]);
    expect(res).toHaveLength(2);
  });
});
