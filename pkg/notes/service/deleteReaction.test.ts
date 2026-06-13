import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.js';
import { NoteNotReactedYetError } from '../model/errors.js';
import { Note, type NoteID } from '../model/note.js';
import { Reaction, type ReactionID } from '../model/reaction.js';
import { DeleteReactionService } from './deleteReaction.js';

const noteFactory = (
  id: NoteID,
  content: string,
  originalNoteID: Option.Option<NoteID>,
) =>
  Result.unwrap(
    Note.new({
      id,
      authorID: '10' as AccountID,
      content,
      visibility: 'PUBLIC',
      contentsWarningComment: '',
      attachmentFileID: [],
      createdAt: new Date(),
      originalNoteID,
      sendTo: Option.none(),
    }),
  );

const normalNote = noteFactory('1' as NoteID, 'test note', Option.none());
const renoteNote = noteFactory('2' as NoteID, '', Option.some('1' as NoteID));

describe('DeleteReactionService', () => {
  const reactionRepo = new InMemoryReactionRepository([
    Reaction.reconstruct({
      id: '100' as ReactionID,
      noteID: '1' as NoteID,
      accountID: '2' as AccountID,
      body: '👍',
    }),
    Reaction.reconstruct({
      id: '101' as ReactionID,
      noteID: '1' as NoteID,
      accountID: '3' as AccountID,
      body: '❤️',
    }),
  ]);
  const noteRepo = new InMemoryNoteRepository([normalNote, renoteNote]);
  const service = new DeleteReactionService(reactionRepo, noteRepo);

  it('should delete a reaction', async () => {
    const res = await service.handle('1' as NoteID, '2' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });

  it('if reaction not found, should return error', async () => {
    const res = await service.handle('999' as NoteID, '2' as AccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteNotReactedYetError);
  });

  it('deleting reaction via renote ID resolves to original note', async () => {
    const res = await service.handle('2' as NoteID, '3' as AccountID);
    expect(Result.isOk(res)).toBe(true);
  });
});
