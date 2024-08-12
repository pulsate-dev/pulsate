import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';
import { type CreateReactionArgs, Reaction } from './reaction.js';

const exampleInput: CreateReactionArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: '👍',
};

const exampleCustomEmojiInput: CreateReactionArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: '<:alias:12345678>',
};

const invalidCustomEmojiInput: CreateReactionArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  body: ':alias:',
};

describe('Reaction', () => {
  it('add reaction to note', () => {
    const reaction = Reaction.new(exampleInput);

    expect(reaction.getAccountID()).toBe(exampleInput.accountID);
    expect(reaction.getNoteID()).toBe(exampleInput.noteID);
    expect(reaction.getEmoji()).toBe(exampleInput.body);
  });
  it('add custom emoji to note', () => {
    const reaction = Reaction.new(exampleCustomEmojiInput);

    expect(reaction.getEmoji()).toBe(exampleCustomEmojiInput.body);
  });
  it('throw error when invalid custom emoji input', () => {
    expect(() => Reaction.new(invalidCustomEmojiInput)).toThrow(
      'Emoji type is invalid',
    );
  });
});
