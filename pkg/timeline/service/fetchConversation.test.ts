import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { InMemoryConversationRepository } from '../adaptor/repository/dummy.js';
import { FetchConversationService } from './fetchConversation.js';

describe('FetchConversationService', () => {
  const noteFactory = (
    id: NoteID,
    authorID: AccountID,
    sendToID: Option.Option<AccountID>,
    createdAt: Date,
  ) =>
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
    });

  /**
   * 1 received 2 notes from 2
   *   1 sent 2 notes to 2
   * 2 received 2 notes from 1
   *   2 sent 2 notes to 1
   *   2 sent 1 note to 4
   * 4 received 1 note from 2
   */
  const testMap = [
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
  const repo = new InMemoryConversationRepository(testMap);
  const service = new FetchConversationService(repo);

  it('should fetch conversations', async () => {
    const result = await service.fetchConversation('1' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([
      {
        id: testMap[3]?.getAuthorID(),
        lastSentAt: testMap[3]?.getCreatedAt(),
        latestNoteID: testMap[3]?.getID(),
        latestNoteAuthor: testMap[3]?.getAuthorID(),
      },
    ]);
  });

  it('should return sorted by lastSentAt', async () => {
    const result = await service.fetchConversation('2' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    const recipients = Result.unwrap(result);
    expect(recipients).toStrictEqual([
      {
        id: testMap[4]?.getAuthorID(),
        lastSentAt: testMap[4]?.getCreatedAt(),
        latestNoteID: testMap[4]?.getID(),
        latestNoteAuthor: testMap[4]?.getAuthorID(),
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
    it('should fetch conversation notes between two accounts', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(4);
      expect(notes[0]?.getID()).toBe('201');
      expect(notes[1]?.getID()).toBe('200');
      expect(notes[2]?.getID()).toBe('101');
      expect(notes[3]?.getID()).toBe('100');
    });

    it('should use default limit of 20', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes.length).toBeLessThanOrEqual(20);
    });

    it('should respect custom limit', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.some(2),
          beforeID: Option.none(),
          afterID: Option.none(),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(2);
      expect(notes[0]?.getID()).toBe('201');
      expect(notes[1]?.getID()).toBe('200');
    });

    it('should fetch notes before specified ID', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.some('201' as NoteID),
          afterID: Option.none(),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(3);
      expect(notes[0]?.getID()).toBe('200');
      expect(notes[1]?.getID()).toBe('101');
      expect(notes[2]?.getID()).toBe('100');
    });

    it('should fetch notes after specified ID', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.none(),
          afterID: Option.some('100' as NoteID),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(3);
      expect(notes[0]?.getID()).toBe('201');
      expect(notes[1]?.getID()).toBe('200');
      expect(notes[2]?.getID()).toBe('101');
    });

    it('should return empty array when no conversation exists', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '3' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toStrictEqual([]);
    });

    it('should return empty array when beforeID does not exist', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.some('999' as NoteID),
          afterID: Option.none(),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toStrictEqual([]);
    });

    it('should return empty array when afterID does not exist', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.none(),
          afterID: Option.some('999' as NoteID),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toStrictEqual([]);
    });

    it('should return error when both beforeID and afterID are specified', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.some('201' as NoteID),
          afterID: Option.some('100' as NoteID),
        },
      );

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result).message).toBe(
        'beforeID and afterID cannot be specified at the same time',
      );
    });

    it('should return notes sorted by creation date (newest first)', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      for (let i = 0; i < notes.length - 1; i++) {
        const currentNote = notes[i];
        const nextNote = notes[i + 1];
        if (currentNote && nextNote) {
          expect(currentNote.getCreatedAt().getTime()).toBeGreaterThanOrEqual(
            nextNote.getCreatedAt().getTime(),
          );
        }
      }
    });

    it('should handle pagination with limit and beforeID', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.some(2),
          beforeID: Option.some('201' as NoteID),
          afterID: Option.none(),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(2);
      expect(notes[0]?.getID()).toBe('200');
      expect(notes[1]?.getID()).toBe('101');
    });

    it('should handle pagination with limit and afterID', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.some(2),
          beforeID: Option.none(),
          afterID: Option.some('100' as NoteID),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      const notes = Result.unwrap(result);
      expect(notes).toHaveLength(2);
      expect(notes[0]?.getID()).toBe('201');
      expect(notes[1]?.getID()).toBe('200');
    });
  });
});
