import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { CreateReactionService } from './createReaction.js';

const noteID = 'noteID_1' as NoteID;
const anotherNoteID = 'noteID_2' as NoteID;
const accountID = 'accountID_1' as AccountID;
const anotherAccountID = 'accountID_2' as AccountID;

const reactionRepository = new InMemoryReactionRepository();
const noteRepository = new InMemoryNoteRepository([
  Note.new({
    id: 'noteID_1' as NoteID,
    authorID: '3' as AccountID,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-10T00:00:00Z'),
    sendTo: Option.none(),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    visibility: 'PUBLIC',
  }),
  Note.new({
    id: 'noteID_2' as NoteID,
    authorID: '3' as AccountID,
    content: 'Another note',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-10T00:00:00Z'),
    sendTo: Option.none(),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    visibility: 'PUBLIC',
  }),
]);
const createReactionService = new CreateReactionService(
  reactionRepository,
  noteRepository,
);

describe('CreateReactionService', () => {
  it('success to create reaction', async () => {
    const res = await createReactionService.handle(noteID, accountID, '👍');

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(await reactionRepository.findByID({ noteID, accountID })),
    ).toBe(true);
  });

  it('fail to re-create reaction from same account', async () => {
    const res = await createReactionService.handle(noteID, accountID, '👍');

    expect(Result.isErr(res)).toBe(true);
  });

  it('fail when note not found', async () => {
    const res = await createReactionService.handle(
      'note_notexist' as NoteID,
      accountID,
      '👍',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('success to create bookmark for author note', async () => {
    const res = await createReactionService.handle(
      noteID,
      '3' as AccountID,
      '👍',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await reactionRepository.findByID({
          noteID,
          accountID: '3' as AccountID,
        }),
      ),
    ).toBe(true);
  });

  it('success to create reaction for another note', async () => {
    const res = await createReactionService.handle(
      anotherNoteID,
      accountID,
      '👍',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await reactionRepository.findByID({
          noteID: anotherNoteID,
          accountID,
        }),
      ),
    ).toBe(true);
  });

  it('success to create reaction from another account', async () => {
    const res = await createReactionService.handle(
      noteID,
      anotherAccountID,
      '👍',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await reactionRepository.findByID({
          noteID,
          accountID: anotherAccountID,
        }),
      ),
    ).toBe(true);
  });
});
