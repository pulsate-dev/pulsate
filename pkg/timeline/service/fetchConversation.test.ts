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
      content: '',
    });

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

  it('should return empty array when no conversations exist', async () => {
    const result = await service.fetchConversation('3' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.unwrap(result)).toStrictEqual([]);
  });
});
