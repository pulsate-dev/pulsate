import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import type { EventMeta } from '../../internal/event/type.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { NoteInvalidReactionError } from './errors.ts';
import { Note, type NoteID } from './note.ts';
import {
  type CreateReactionArgs,
  Reaction,
  type ReactionID,
} from './reaction.ts';

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
const authorID = '10' as AccountID;
const noteMeta: EventMeta<AccountID> = {
  idGenerator: workingIDGenerator,
  actor: authorID,
  occurredAt,
};

const noteFactory = (
  id: NoteID,
  content: string,
  originalNoteID: Option.Option<NoteID>,
) =>
  Result.unwrap(
    Note.new(
      {
        id,
        authorID,
        content,
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        attachmentFileID: [],
        createdAt: new Date(),
        originalNoteID,
        sendTo: Option.none(),
      },
      noteMeta,
    ),
  );

const normalNote = noteFactory('1' as NoteID, 'test note', Option.none());
const renoteNote = noteFactory('2' as NoteID, '', Option.some('1' as NoteID));
const quoteNote = noteFactory(
  '3' as NoteID,
  'quoted content',
  Option.some('1' as NoteID),
);

const baseArgs: CreateReactionArgs = {
  id: '100' as ReactionID,
  note: normalNote,
  accountID: '2' as AccountID,
  body: '👍',
};

const meta: EventMeta<AccountID> = {
  idGenerator: workingIDGenerator,
  actor: baseArgs.accountID,
  occurredAt,
};

describe('Reaction', () => {
  describe('valid input', () => {
    it.each([
      { name: 'unicode emoji', body: '👍' },
      { name: 'custom emoji', body: '<:alias:12345678>' },
    ])('$name returns ok', ({ body }) => {
      const result = Reaction.new({ ...baseArgs, body }, meta);
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).getEmoji()).toBe(body);
    });
  });

  describe('invalid input', () => {
    it.each([
      { name: 'plain text alias format', body: ':alias:' },
      { name: 'empty string', body: '' },
      { name: 'plain text', body: 'hello' },
    ])('$name returns error', ({ body }) => {
      const result = Reaction.new({ ...baseArgs, body }, meta);
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(NoteInvalidReactionError);
    });

    it('returns Error when event ID generation fails', () => {
      const result = Reaction.new(baseArgs, {
        ...meta,
        idGenerator: failingIDGenerator,
      });
      expect(Result.isErr(result)).toBe(true);
    });
  });

  it('stores accountID and noteID correctly', () => {
    const reaction = Result.unwrap(Reaction.new(baseArgs, meta));

    expect(reaction.getAccountID()).toBe(baseArgs.accountID);
    expect(reaction.getNoteID()).toBe(normalNote.getID());
  });

  describe('reaction target resolution', () => {
    it('reacting on a normal note targets the note itself', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: normalNote }, meta),
      );
      expect(reaction.getNoteID()).toBe(normalNote.getID());
    });

    it('reacting on a renote targets the original note', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: renoteNote }, meta),
      );
      expect(reaction.getNoteID()).toBe('1' as NoteID);
    });

    it('reacting on a quote targets the quote itself', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: quoteNote }, meta),
      );
      expect(reaction.getNoteID()).toBe(quoteNote.getID());
    });
  });

  describe('domain events', () => {
    it('should not push any event on reconstruct', () => {
      const reaction = Reaction.reconstruct({
        id: baseArgs.id,
        accountID: baseArgs.accountID,
        noteID: normalNote.getID(),
        body: baseArgs.body,
      });

      expect(reaction.pullEvents()).toStrictEqual([]);
    });

    it('should push exactly one note.reaction.created event on success', () => {
      const reaction = Result.unwrap(Reaction.new(baseArgs, meta));

      const events = reaction.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toStrictEqual({
        id: events[0]?.id,
        eventName: 'note.reaction.created',
        target: normalNote.getID(),
        actor: baseArgs.accountID,
        occurredAt,
        payload: { accountID: baseArgs.accountID, emoji: baseArgs.body },
      });
    });

    it('should not push any event when the emoji is invalid', () => {
      const result = Reaction.new({ ...baseArgs, body: 'invalid' }, meta);

      expect(Result.isErr(result)).toBe(true);
    });

    it('should be a destructive read: pullEvents returns empty on the second call', () => {
      const reaction = Result.unwrap(Reaction.new(baseArgs, meta));

      reaction.pullEvents();

      expect(reaction.pullEvents()).toStrictEqual([]);
    });
  });
});
