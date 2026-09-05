import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { Bookmark, type CreateBookmarkArgs } from './bookmark.ts';
import type { NoteID } from './note.ts';

const exampleInput: CreateBookmarkArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
};

describe('Bookmark', () => {
  it('add note to bookmark', () => {
    const res = Bookmark.new(exampleInput, exampleInput.accountID);
    expect(Result.isOk(res)).toBe(true);

    const bookmark = Result.unwrap(res);
    expect(bookmark.getNoteID()).toBe(exampleInput.noteID);
    expect(bookmark.getAccountID()).toBe(exampleInput.accountID);
  });

  describe('domain events', () => {
    it('should not push any event on reconstruct', () => {
      const bookmark = Bookmark.reconstruct(exampleInput);

      expect(bookmark.pullEvents()).toStrictEqual([]);
    });

    it('should push exactly one note.bookmark.created event on success', () => {
      const bookmark = Result.unwrap(
        Bookmark.new(exampleInput, exampleInput.accountID),
      );

      const events = bookmark.pullEvents();

      expect(events).toHaveLength(1);
      const [event] = events;
      expect(event?.eventName).toBe('note.bookmark.created');
      expect(event?.target).toBe(exampleInput.noteID);
      expect(event?.actor).toBe(exampleInput.accountID);
      expect(event?.payload).toStrictEqual({
        accountID: exampleInput.accountID,
      });
    });

    it('should be a destructive read: pullEvents returns empty on the second call', () => {
      const bookmark = Result.unwrap(
        Bookmark.new(exampleInput, exampleInput.accountID),
      );

      bookmark.pullEvents();

      expect(bookmark.pullEvents()).toStrictEqual([]);
    });
  });
});
