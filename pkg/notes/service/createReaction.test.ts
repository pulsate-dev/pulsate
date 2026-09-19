import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AccountID } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.ts';
import { Note, type NoteID } from '../model/note.ts';
import { CreateReactionService } from './createReaction.ts';

const idGenerator = new SnowflakeIDGenerator(1, new MockClock(new Date()));

const noteFactory = (
  id: NoteID,
  authorID: AccountID,
  content: string,
  originalNoteID: Option.Option<NoteID>,
  createdAt: Date,
) =>
  Note.reconstruct({
    id,
    authorID,
    content,
    visibility: 'PUBLIC',
    contentsWarningComment: '',
    attachmentFileID: [],
    createdAt,
    originalNoteID,
    sendTo: Option.none(),
    updatedAt: Option.none(),
    deletedAt: Option.none(),
  });

const normalNote = noteFactory(
  '1' as NoteID,
  '2' as AccountID,
  'this is a test note',
  Option.none(),
  new Date('2023-10-10T00:00:00Z'),
);
const renoteNote = noteFactory(
  '2' as NoteID,
  '3' as AccountID,
  '',
  Option.some('1' as NoteID),
  new Date('2023-10-10T01:00:00Z'),
);

let reactionRepository = new InMemoryReactionRepository();
let noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
const eventPublisher: EventPublisher = { publishMany: vi.fn() };
let service = new CreateReactionService(
  idGenerator,
  reactionRepository,
  noteRepository,
  eventPublisher,
);

describe('CreateReactionService', () => {
  afterEach(() => {
    reactionRepository = new InMemoryReactionRepository();
    noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
    vi.clearAllMocks();
    service = new CreateReactionService(
      idGenerator,
      reactionRepository,
      noteRepository,
      eventPublisher,
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
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.reaction.created' }),
    ]);
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
    // The returned note should be the original note, not the renote
    expect(Result.unwrap(res).getID()).toBe('1' as NoteID);
  });
});
