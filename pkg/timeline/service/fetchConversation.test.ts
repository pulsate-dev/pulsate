import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { DirectNote, type DirectNoteID } from '../../notes/model/directNote.js';
import { InMemoryConversationRepository } from '../adaptor/repository/dummy.js';
import { FetchConversationService } from './fetchConversation.js';

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
 *   2 sent 1 note to 4 (via 4-->2 below)
 * 4 received 1 note from 2
 */
const dummyDirectNotes = [
  // 1-->2
  directNoteFactory(
    '100' as DirectNoteID,
    '1' as AccountID,
    '2' as AccountID,
    new Date('2023-09-10T00:00:00Z'),
  ),
  // 1-->2
  directNoteFactory(
    '101' as DirectNoteID,
    '1' as AccountID,
    '2' as AccountID,
    new Date('2023-09-11T00:00:00Z'),
  ),
  // 2-->1
  directNoteFactory(
    '200' as DirectNoteID,
    '2' as AccountID,
    '1' as AccountID,
    new Date('2023-09-12T00:00:00Z'),
  ),
  // 2-->1
  directNoteFactory(
    '201' as DirectNoteID,
    '2' as AccountID,
    '1' as AccountID,
    new Date('2023-09-13T00:00:00Z'),
  ),
  // 4-->2
  directNoteFactory(
    '400' as DirectNoteID,
    '4' as AccountID,
    '2' as AccountID,
    new Date('2024-01-01T00:00:00Z'),
  ),
];

const conversationRepo = new InMemoryConversationRepository(dummyDirectNotes);
const service = new FetchConversationService(conversationRepo);

describe('FetchConversationService', () => {
  it('should fetch conversations', async () => {
    const result = await service.fetchConversation('1' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([
      {
        id: dummyDirectNotes[3]?.getAuthorID(),
        lastSentAt: dummyDirectNotes[3]?.getCreatedAt(),
        latestNoteID: dummyDirectNotes[3]?.getID(),
        latestNoteAuthor: dummyDirectNotes[3]?.getAuthorID(),
      },
    ]);
  });

  it('should return sorted by lastSentAt', async () => {
    const result = await service.fetchConversation('2' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    const recipients = Result.unwrap(result);
    expect(recipients).toStrictEqual([
      {
        id: dummyDirectNotes[4]?.getAuthorID(),
        lastSentAt: dummyDirectNotes[4]?.getCreatedAt(),
        latestNoteID: dummyDirectNotes[4]?.getID(),
        latestNoteAuthor: dummyDirectNotes[4]?.getAuthorID(),
      },
      {
        id: '1' as AccountID,
        lastSentAt: new Date('2023-09-13T00:00:00Z'),
        latestNoteID: '201' as DirectNoteID,
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
    it('should pass default limit of 20 when no limit provided', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
      );

      expect(Result.isOk(result)).toBe(true);
      // dataset has 4 notes between 1 and 2; all returned since limit=20
      expect(Result.unwrap(result)).toHaveLength(4);
    });

    it('should pass custom limit to repository', async () => {
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
      expect(Result.unwrap(result)).toHaveLength(2);
      // newest two notes between 1 and 2
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        '201',
        '200',
      ]);
    });

    it('should apply beforeID cursor correctly', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.some('200' as DirectNoteID),
          afterID: Option.none(),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      // notes older than '200' (2023-09-12): '101' and '100'
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        '101',
        '100',
      ]);
    });

    it('should apply afterID cursor correctly', async () => {
      const result = await service.fetchConversationNotes(
        '1' as AccountID,
        '2' as AccountID,
        {
          limit: Option.none(),
          beforeID: Option.none(),
          afterID: Option.some('200' as DirectNoteID),
        },
      );

      expect(Result.isOk(result)).toBe(true);
      // notes newer than '200' (2023-09-12): '201'
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        '201',
      ]);
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
