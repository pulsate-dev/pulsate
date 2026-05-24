import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { NoteInvalidReactionError } from './errors.js';
import type { NoteID } from './note.js';
import {
  type CreateReactionArgs,
  Reaction,
  type ReactionID,
} from './reaction.js';

const baseArgs: CreateReactionArgs = {
  id: '100' as ReactionID,
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: '👍',
};

describe('Reaction', () => {
  describe('valid input', () => {
    it.each([
      { name: 'unicode emoji', body: '👍' },
      { name: 'custom emoji', body: '<:alias:12345678>' },
    ])('$name returns ok', ({ body }) => {
      const result = Reaction.new({ ...baseArgs, body });
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
      const result = Reaction.new({ ...baseArgs, body });
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(NoteInvalidReactionError);
    });
  });

  it('stores accountID and noteID correctly', () => {
    const reaction = Result.unwrap(Reaction.new(baseArgs));

    expect(reaction.getAccountID()).toBe(baseArgs.accountID);
    expect(reaction.getNoteID()).toBe(baseArgs.noteID);
  });
});
