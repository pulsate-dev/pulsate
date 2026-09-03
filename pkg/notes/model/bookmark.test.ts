import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import type { EventMeta } from '../../internal/event/type.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { Bookmark, type CreateBookmarkArgs } from './bookmark.ts';
import type { NoteID } from './note.ts';

const exampleInput: CreateBookmarkArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
};

const occurredAt = new Date('2023-09-10T00:00:00.000Z');
const workingIDGenerator = new SnowflakeIDGenerator(
  0,
  new MockClock(occurredAt),
);
// NOTE: a clock stuck before OFFSET_FROM_UNIX_EPOCH makes generate() always fail.
const failingIDGenerator = new SnowflakeIDGenerator(
  0,
  new MockClock(new Date(0)),
);
const meta: EventMeta<AccountID> = {
  idGenerator: workingIDGenerator,
  actor: exampleInput.accountID,
  occurredAt,
};

describe('Bookmark', () => {
  it('add note to bookmark', () => {
    const res = Bookmark.new(exampleInput, meta);
    expect(Result.isOk(res)).toBe(true);

    const bookmark = Result.unwrap(res);
    expect(bookmark.getNoteID()).toBe(exampleInput.noteID);
    expect(bookmark.getAccountID()).toBe(exampleInput.accountID);
  });

  it('should return Error when event ID generation fails', () => {
    const res = Bookmark.new(exampleInput, {
      ...meta,
      idGenerator: failingIDGenerator,
    });

    expect(Result.isErr(res)).toBe(true);
  });

  describe('domain events', () => {
    it('should not push any event on reconstruct', () => {
      const bookmark = Bookmark.reconstruct(exampleInput);

      expect(bookmark.pullEvents()).toStrictEqual([]);
    });

    it('should push exactly one note.bookmark.created event on success', () => {
      const bookmark = Result.unwrap(Bookmark.new(exampleInput, meta));

      const events = bookmark.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toStrictEqual({
        id: events[0]?.id,
        eventName: 'note.bookmark.created',
        target: exampleInput.noteID,
        actor: exampleInput.accountID,
        occurredAt,
        payload: { accountID: exampleInput.accountID },
      });
    });

    it('should be a destructive read: pullEvents returns empty on the second call', () => {
      const bookmark = Result.unwrap(Bookmark.new(exampleInput, meta));

      bookmark.pullEvents();

      expect(bookmark.pullEvents()).toStrictEqual([]);
    });
  });
});
