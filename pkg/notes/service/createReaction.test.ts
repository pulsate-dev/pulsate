import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { CreateReactionService } from './createReaction.js';

let reactionRepository = new InMemoryReactionRepository();
let noteRepository = new InMemoryNoteRepository([
  Note.new({
    id: '1' as NoteID,
    authorID: '2' as AccountID,
    content: '',
    visibility: 'PUBLIC',
    contentsWarningComment: '',
    attachmentFileID: [],
    createdAt: new Date(2023, 9, 10, 0, 0),
    originalNoteID: Option.none(),
    sendTo: Option.none(),
  }),
]);
let service = new CreateReactionService(reactionRepository, noteRepository);

describe('CreateReactionService', () => {
  afterEach(() => {
    reactionRepository = new InMemoryReactionRepository();
    noteRepository = new InMemoryNoteRepository([
      Note.new({
        id: '1' as NoteID,
        authorID: '2' as AccountID,
        content: '',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        attachmentFileID: [],
        createdAt: new Date(2023, 9, 10, 0, 0),
        originalNoteID: Option.none(),
        sendTo: Option.none(),
      }),
    ]);
    service = new CreateReactionService(reactionRepository, noteRepository);
  });
  it('add reaction', async () => {
    const res = await service.handle('1' as NoteID, '3' as AccountID, '👍');

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await reactionRepository.findByID({
          noteID: '1' as NoteID,
          accountID: '3' as AccountID,
        }),
      ),
    ).toBe(true);
  });

  it('error when already reacted', async () => {
    await service.handle('1' as NoteID, '3' as AccountID, '👍');
    const res = await service.handle('1' as NoteID, '3' as AccountID, '👌');
    const reaction = await reactionRepository.findByID({
      noteID: '1' as NoteID,
      accountID: '3' as AccountID,
    });

    expect(Result.isErr(res)).toBe(true);
    expect(Option.isSome(reaction)).toBe(true);
    expect(Option.unwrap(reaction).getEmoji()).toBe('👍');
  });

  it('error when note not found', async () => {
    const res = await service.handle('5' as NoteID, '3' as AccountID, '👍');

    expect(Result.isErr(res)).toBe(true);
  });
});
