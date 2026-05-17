import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';
import {
  type CreateReactionArgs,
  Reaction,
  type ReactionID,
} from './reaction.js';

const exampleInput: CreateReactionArgs = {
  id: '100' as ReactionID,
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: '👍',
};

const exampleCustomEmojiInput: CreateReactionArgs = {
  id: '100' as ReactionID,
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: '<:alias:12345678>',
};

const invalidCustomEmojiInput: CreateReactionArgs = {
  id: '100' as ReactionID,
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: ':alias:',
};

describe('Reaction', () => {
  it.each([
    {
      title: 'valid unicode emoji',
      input: exampleInput,
      isOk: true,
    },
    {
      title: 'valid custom emoji',
      input: exampleCustomEmojiInput,
      isOk: true,
    },
    {
      title: 'invalid custom emoji format',
      input: invalidCustomEmojiInput,
      isOk: false,
    },
  ])('Reaction.new: $title', ({ input, isOk }) => {
    const result = Reaction.new(input);
    expect(Result.isOk(result)).toBe(isOk);
  });

  it('add reaction to note', () => {
    const result = Reaction.new(exampleInput);
    expect(Result.isOk(result)).toBe(true);

    const reaction = Result.unwrap(result);
    expect(reaction.getAccountID()).toBe(exampleInput.accountID);
    expect(reaction.getNoteID()).toBe(exampleInput.noteID);
    expect(reaction.getEmoji()).toBe(exampleInput.body);
  });

  it('add custom emoji to note', () => {
    const result = Reaction.new(exampleCustomEmojiInput);
    expect(Result.isOk(result)).toBe(true);

    const reaction = Result.unwrap(result);
    expect(reaction.getEmoji()).toBe(exampleCustomEmojiInput.body);
  });
});
