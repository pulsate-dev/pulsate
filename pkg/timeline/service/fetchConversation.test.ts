import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { DirectNote, type DirectNoteID } from '../../notes/model/directNote.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import type { DirectNoteRepository } from '../../notes/model/repository.js';
import { InMemoryConversationRepository } from '../adaptor/repository/dummy.js';
import { FetchConversationService } from './fetchConversation.js';

const noteFactory = (
  id: NoteID,
  authorID: AccountID,
  sendToID: Option.Option<AccountID>,
  createdAt: Date,
) =>
  Result.unwrap(
    Note.new({
      attachmentFileID: [],
      authorID,
      contentsWarningComment: '',
      createdAt,
      id,
      originalNoteID: Option.none(),
      sendTo: sendToID,
      visibility: 'DIRECT',
      content: 'This is a test note',
    }),
  );

const directNoteFactory = (
  id: DirectNoteID,
  authorID: AccountID,
  recipientID: AccountID,
  createdAt: Date,
) =>
  Result.unwrap(
    DirectNote.new({
      id,
      authorID,
      recipientID,
      content: 'This is a test note',
      contentsWarningComment: '',
      attachmentFileID: [],
      createdAt,
    }),
  );

/**
 * 1 received 2 notes from 2
 *   1 sent 2 notes to 2
 * 2 received 2 notes from 1
 *   2 sent 2 notes to 1
 *   2 sent 1 note to 4
 * 4 received 1 note from 2
 */
const noteTestMap = [
  // 1-->2
  noteFactory(
    '100' as NoteID,
    '1' as AccountID,
    Option.some('2' as AccountID),
    new Date('2023-09-10T00:00:00Z'),
  ),
  // 1-->2
  noteFactory(
    '101' as NoteID,
    '1' as AccountID,
    Option.some('2' as AccountID),
    new Date('2023-09-11T00:00:00Z'),
  ),
  // 2-->1
  noteFactory(
    '200' as NoteID,
    '2' as AccountID,
    Option.some('1' as AccountID),
    new Date('2023-09-12T00:00:00Z'),
  ),
  // 2-->1
  noteFactory(
    '201' as NoteID,
    '2' as AccountID,
    Option.some('1' as AccountID),
    new Date('2023-09-13T00:00:00Z'),
  ),
  // 4-->2
  noteFactory(
    '400' as NoteID,
    '4' as AccountID,
    Option.some('2' as AccountID),
    new Date('2024-01-01T00:00:00Z'),
  ),
];

const dummyDirectNotes = [
  directNoteFactory(
    '100' as DirectNoteID,
    '1' as AccountID,
    '2' as AccountID,
    new Date('2023-09-10T00:00:00Z'),
  ),
  directNoteFactory(
    '101' as DirectNoteID,
    '1' as AccountID,
    '2' as AccountID,
    new Date('2023-09-11T00:00:00Z'),
  ),
  directNoteFactory(
    '200' as DirectNoteID,
    '2' as AccountID,
    '1' as AccountID,
    new Date('2023-09-12T00:00:00Z'),
  ),
  directNoteFactory(
    '201' as DirectNoteID,
    '2' as AccountID,
    '1' as AccountID,
    new Date('2023-09-13T00:00:00Z'),
  ),
];

const mockDirectNoteRepo: DirectNoteRepository = {
  create: vi.fn(),
  findByID: vi.fn(),
  findByRecipientID: vi.fn(),
  findConversation: vi.fn(),
  deleteByID: vi.fn(),
};

const conversationRepo = new InMemoryConversationRepository(noteTestMap);
const service = new FetchConversationService(
  conversationRepo,
  mockDirectNoteRepo,
);

describe('FetchConversationService', () => {
  it('should fetch conversations', async () => {
    const result = await service.fetchConversation('1' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([
      {
        id: noteTestMap[3]?.getAuthorID(),
        lastSentAt: noteTestMap[3]?.getCreatedAt(),
        latestNoteID: noteTestMap[3]?.getID(),
        latestNoteAuthor: noteTestMap[3]?.getAuthorID(),
      },
    ]);
  });

  it('should return sorted by lastSentAt', async () => {
    const result = await service.fetchConversation('2' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    const recipients = Result.unwrap(result);
    expect(recipients).toStrictEqual([
      {
        id: noteTestMap[4]?.getAuthorID(),
        lastSentAt: noteTestMap[4]?.getCreatedAt(),
        latestNoteID: noteTestMap[4]?.getID(),
        latestNoteAuthor: noteTestMap[4]?.getAuthorID(),
      },
      {
        id: '1' as AccountID,
        lastSentAt: new Date('2023-09-13T00:00:00Z'),
        latestNoteID: '201' as NoteID,
        latestNoteAuthor: '2' as AccountID,
      },
    ]);
  });

  it('should return empty array when no conversations exist', async () => {
    const result = await service.fetchConversation('3' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([]);
  });

  describe('fetchConversationNotes', () => {
    beforeEach(() => {
      vi.mocked(mockDirectNoteRepo.findConversation).mockResolvedValue(
        Result.ok(dummyDirectNotes),
      );
    });

    it('should pass default limit of 20 when no limit provided', async () => {
      await service.fetchConversationNotes('1' as AccountID, '2' as AccountID);

      expect(mockDirectNoteRepo.findConversation).toHaveBeenCalledWith(
        '1' as AccountID,
        '2' as AccountID,
        { limit: 20, cursor: undefined },
      );
    });

    it('should pass custom limit to repository', async () => {
      await service.fetchConversationNotes('1' as AccountID, '2' as AccountID, {
        limit: Option.some(5),
        beforeID: Option.none(),
        afterID: Option.none(),
      });

      expect(mockDirectNoteRepo.findConversation).toHaveBeenCalledWith(
        '1' as AccountID,
        '2' as AccountID,
        { limit: 5, cursor: undefined },
      );
    });

    it('should pass beforeID cursor to repository', async () => {
      await service.fetchConversationNotes('1' as AccountID, '2' as AccountID, {
        limit: Option.none(),
        beforeID: Option.some('201' as DirectNoteID),
        afterID: Option.none(),
      });

      expect(mockDirectNoteRepo.findConversation).toHaveBeenCalledWith(
        '1' as AccountID,
        '2' as AccountID,
        { limit: 20, cursor: { type: 'before', id: '201' as DirectNoteID } },
      );
    });

    it('should pass afterID cursor to repository', async () => {
      await service.fetchConversationNotes('1' as AccountID, '2' as AccountID, {
        limit: Option.none(),
        beforeID: Option.none(),
        afterID: Option.some('100' as DirectNoteID),
      });

      expect(mockDirectNoteRepo.findConversation).toHaveBeenCalledWith(
        '1' as AccountID,
        '2' as AccountID,
        { limit: 20, cursor: { type: 'after', id: '100' as DirectNoteID } },
      );
    });

    it('should return what the repository returns', async () => {
      const note = dummyDirectNotes[0];
      if (!note) throw new Error('test data missing');
      vi.mocked(mockDirectNoteRepo.findConversation).mockResolvedValue(
        Result.ok([note]),
      );

      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toStrictEqual([note]);
    });

    it('should return error when both beforeID and afterID are specified', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.some('201' as DirectNoteID),
          afterID: Option.some('100' as DirectNoteID),
        },
      );

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result).message).toBe(
        'beforeID and afterID cannot be specified at the same time',
      );
    });
  });
});
