import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { DirectNote } from '../../notes/model/directNote.ts';
import { InMemoryConversationRepository } from '../adaptor/repository/dummy.ts';
import { FetchConversationService } from './fetchConversation.ts';

const directNoteFactory = (
  authorID: AccountID,
  recipientID: AccountID,
  createdAt: Date,
) =>
  Result.unwrap(
    DirectNote.new(
      {
        id: generateDummyID<DirectNote>(createdAt),
        authorID,
        recipientID,
        content: 'This is a test note',
        contentsWarningComment: '',
        attachmentFileID: [],
        createdAt,
      },
      authorID,
    ),
  );

const accountA = generateDummyAccount().getID();
const accountB = generateDummyAccount().getID();
const accountWithoutNotes = generateDummyAccount().getID();
const accountC = generateDummyAccount().getID();

/**
 * A received 2 notes from B
 *   A sent 2 notes to B
 * B received 2 notes from A
 *   B sent 2 notes to A
 *   B sent 1 note to C (via C-->B below)
 * C received 1 note from B
 */
// A-->B
const noteAToB1 = directNoteFactory(accountA, accountB, DUMMY_BASE_DATE);
// A-->B
const noteAToB2 = directNoteFactory(
  accountA,
  accountB,
  addDuration(DUMMY_BASE_DATE, { days: 1 }),
);
// B-->A
const noteBToA1 = directNoteFactory(
  accountB,
  accountA,
  addDuration(DUMMY_BASE_DATE, { days: 2 }),
);
// B-->A
const noteBToA2 = directNoteFactory(
  accountB,
  accountA,
  addDuration(DUMMY_BASE_DATE, { days: 3 }),
);
// C-->B
const noteCToB = directNoteFactory(
  accountC,
  accountB,
  addDuration(DUMMY_BASE_DATE, { days: 100 }),
);
const dummyDirectNotes = [noteAToB1, noteAToB2, noteBToA1, noteBToA2, noteCToB];

const conversationRepo = new InMemoryConversationRepository(dummyDirectNotes);
const service = new FetchConversationService(conversationRepo);

describe('FetchConversationService', () => {
  it('should fetch conversations', async () => {
    const result = await service.fetchConversation(accountA);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([
      {
        id: noteBToA2.getAuthorID(),
        lastSentAt: noteBToA2.getCreatedAt(),
        latestNoteID: noteBToA2.getID(),
        latestNoteAuthor: noteBToA2.getAuthorID(),
      },
    ]);
  });

  it('should return sorted by lastSentAt', async () => {
    const result = await service.fetchConversation(accountB);

    expect(Result.isOk(result)).toBe(true);
    const recipients = Result.unwrap(result);
    expect(recipients).toStrictEqual([
      {
        id: noteCToB.getAuthorID(),
        lastSentAt: noteCToB.getCreatedAt(),
        latestNoteID: noteCToB.getID(),
        latestNoteAuthor: noteCToB.getAuthorID(),
      },
      {
        id: accountA,
        lastSentAt: noteBToA2.getCreatedAt(),
        latestNoteID: noteBToA2.getID(),
        latestNoteAuthor: accountB,
      },
    ]);
  });

  it('should return empty array when no conversations exist', async () => {
    const result = await service.fetchConversation(accountWithoutNotes);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([]);
  });

  describe('fetchConversationNotes', () => {
    it('should pass default limit of 20 when no limit provided', async () => {
      const result = await service.fetchConversationNotes(accountA, accountB);

      expect(Result.isOk(result)).toBe(true);
      // dataset has 4 notes between A and B; all returned since limit=20
      expect(Result.unwrap(result)).toHaveLength(4);
    });

    it('should pass custom limit to repository', async () => {
      const result = await service.fetchConversationNotes(accountA, accountB, {
        limit: Option.some(2),
        beforeID: Option.none(),
        afterID: Option.none(),
      });

      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toHaveLength(2);
      // newest two notes between A and B
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        noteBToA2.getID(),
        noteBToA1.getID(),
      ]);
    });

    it('should apply beforeID cursor correctly', async () => {
      const result = await service.fetchConversationNotes(accountA, accountB, {
        limit: Option.none(),
        beforeID: Option.some(noteBToA1.getID()),
        afterID: Option.none(),
      });

      expect(Result.isOk(result)).toBe(true);
      // notes older than the 3rd note: the 2nd and 1st notes
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        noteAToB2.getID(),
        noteAToB1.getID(),
      ]);
    });

    it('should apply afterID cursor correctly', async () => {
      const result = await service.fetchConversationNotes(accountA, accountB, {
        limit: Option.none(),
        beforeID: Option.none(),
        afterID: Option.some(noteBToA1.getID()),
      });

      expect(Result.isOk(result)).toBe(true);
      // notes newer than the 3rd note: the 4th note
      expect(Result.unwrap(result).map((n) => n.getID())).toStrictEqual([
        noteBToA2.getID(),
      ]);
    });

    it('should return error when both beforeID and afterID are specified', async () => {
      const result = await service.fetchConversationNotes(accountA, accountB, {
        limit: Option.none(),
        beforeID: Option.some(noteBToA2.getID()),
        afterID: Option.some(noteAToB1.getID()),
      });

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result).message).toBe(
        'beforeID and afterID cannot be specified at the same time',
      );
    });
  });
});
