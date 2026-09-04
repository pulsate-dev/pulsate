import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { NoteInvalidReactionError } from './errors.ts';
import { Note, type NoteID } from './note.ts';
import {
  type CreateReactionArgs,
  Reaction,
  type ReactionID,
} from './reaction.ts';

const authorID = '10' as AccountID;

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
      authorID,
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

describe('Reaction', () => {
  describe('valid input', () => {
    it.each([
      { name: 'unicode emoji', body: '👍' },
      { name: 'custom emoji', body: '<:alias:12345678>' },
    ])('$name returns ok', ({ body }) => {
      const result = Reaction.new({ ...baseArgs, body }, baseArgs.accountID);
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
      const result = Reaction.new({ ...baseArgs, body }, baseArgs.accountID);
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(NoteInvalidReactionError);
    });
  });

  it('stores accountID and noteID correctly', () => {
    const reaction = Result.unwrap(Reaction.new(baseArgs, baseArgs.accountID));

    expect(reaction.getAccountID()).toBe(baseArgs.accountID);
    expect(reaction.getNoteID()).toBe(normalNote.getID());
  });

  describe('reaction target resolution', () => {
    it('reacting on a normal note targets the note itself', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: normalNote }, baseArgs.accountID),
      );
      expect(reaction.getNoteID()).toBe(normalNote.getID());
    });

    it('reacting on a renote targets the original note', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: renoteNote }, baseArgs.accountID),
      );
      expect(reaction.getNoteID()).toBe('1' as NoteID);
    });

    it('reacting on a quote targets the quote itself', () => {
      const reaction = Result.unwrap(
        Reaction.new({ ...baseArgs, note: quoteNote }, baseArgs.accountID),
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
      const reaction = Result.unwrap(
        Reaction.new(baseArgs, baseArgs.accountID),
      );

      const events = reaction.pullEvents();

      expect(events).toHaveLength(1);
      const [event] = events;
      expect(event?.eventName).toBe('note.reaction.created');
      expect(event?.target).toBe(normalNote.getID());
      expect(event?.actor).toBe(baseArgs.accountID);
      expect(event?.payload).toStrictEqual({
        accountID: baseArgs.accountID,
        emoji: baseArgs.body,
      });
    });

    it('should not push any event when the emoji is invalid', () => {
      const result = Reaction.new(
        { ...baseArgs, body: 'invalid' },
        baseArgs.accountID,
      );

      expect(Result.isErr(result)).toBe(true);
    });

    it('should be a destructive read: pullEvents returns empty on the second call', () => {
      const reaction = Result.unwrap(
        Reaction.new(baseArgs, baseArgs.accountID),
      );

      reaction.pullEvents();

      expect(reaction.pullEvents()).toStrictEqual([]);
    });
  });
});
