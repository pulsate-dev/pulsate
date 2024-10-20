import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryReactionRepository } from '../adaptor/repository/dummy.js';
import { NoteNotFoundError } from '../model/errors.js';
import type { NoteID } from '../model/note.js';
import { Reaction } from '../model/reaction.js';
import { DeleteReactionService } from './deleteReaction.js';

describe('DeleteReactionService', () => {
  const reactionRepo = new InMemoryReactionRepository([
    Reaction.new({
      noteID: '1' as NoteID,
      accountID: '2' as AccountID,
      body: '👍',
    }),
  ]);
  const service = new DeleteReactionService(reactionRepo);

  it('should delete a reaction', async () => {
    const res = await service.handle('1' as NoteID, '2' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('if reaction not found, should return error', async () => {
    const res = await service.handle('999' as NoteID, '2' as AccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteNotFoundError);
  });
});
