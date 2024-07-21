import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';
import { type CreateReactionArgs, Reaction } from './reaction.js';

const exampleInput: CreateReactionArgs = {
  noteID: '1' as NoteID,
  accountID: '2' as AccountID,
  emoji: '👍',
};

describe('Reaction', () => {
  it('add reaction to note', () => {
    const reaction = Reaction.new(exampleInput);

    expect(reaction.getNoteID()).toBe(exampleInput.noteID);
    expect(reaction.getAccountID()).toBe(exampleInput.accountID);
    expect(reaction.getEmoji()).toBe(exampleInput.emoji);
  });
});
