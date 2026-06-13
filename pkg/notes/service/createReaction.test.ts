import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.js';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { CreateReactionService } from './createReaction.js';

const idGenerator = new SnowflakeIDGenerator(1, new MockClock(new Date()));

const noteFactory = (
  id: NoteID,
  authorID: AccountID,
  content: string,
  originalNoteID: Option.Option<NoteID>,
  createdAt: Date,
) =>
  Result.unwrap(
    Note.new({
      id,
      authorID,
      content,
      visibility: 'PUBLIC',
      contentsWarningComment: '',
      attachmentFileID: [],
      createdAt,
      originalNoteID,
      sendTo: Option.none(),
    }),
  );

const normalNote = noteFactory(
  '1' as NoteID,
  '2' as AccountID,
  'this is a test note',
  Option.none(),
  new Date(2023, 9, 10, 0, 0),
);
const renoteNote = noteFactory(
  '2' as NoteID,
  '3' as AccountID,
  '',
  Option.some('1' as NoteID),
  new Date(2023, 9, 10, 1, 0),
);

let reactionRepository = new InMemoryReactionRepository();
let noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
let service = new CreateReactionService(
  idGenerator,
  reactionRepository,
  noteRepository,
);

describe('CreateReactionService', () => {
  afterEach(() => {
    reactionRepository = new InMemoryReactionRepository();
    noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
    service = new CreateReactionService(
      idGenerator,
      reactionRepository,
      noteRepository,
    );
  });

  it('add reaction', async () => {
    const res = await service.handle('1' as NoteID, '3' as AccountID, '👍');

    expect(Result.isOk(res)).toBe(true);
    expect(
      Result.isOk(
        await reactionRepository.findByCompositeID({
          noteID: '1' as NoteID,
          accountID: '3' as AccountID,
        }),
      ),
    ).toBe(true);
  });

  it('error when already reacted', async () => {
    await service.handle('1' as NoteID, '3' as AccountID, '👍');
    const res = await service.handle('1' as NoteID, '3' as AccountID, '👌');

    const reaction = await reactionRepository.findByCompositeID({
      noteID: '1' as NoteID,
      accountID: '3' as AccountID,
    });

    expect(Result.isErr(res)).toBe(true);
    expect(Result.isOk(reaction)).toBe(true);
    expect(Result.unwrap(reaction).getEmoji()).toBe('👍');
  });

  it('error when note not found', async () => {
    const res = await service.handle('5' as NoteID, '3' as AccountID, '👍');

    expect(Result.isErr(res)).toBe(true);
  });

  it('reacting on a renote is attributed to the original note', async () => {
    const res = await service.handle('2' as NoteID, '4' as AccountID, '👍');

    expect(Result.isOk(res)).toBe(true);
    expect(
      Result.isOk(
        await reactionRepository.findByCompositeID({
          noteID: '1' as NoteID,
          accountID: '4' as AccountID,
        }),
      ),
    ).toBe(true);
  });
});
