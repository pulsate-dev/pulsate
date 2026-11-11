import { Option, Result } from '@mikuroxina/mini-fn';
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedObject,
  vi,
} from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import {
  InMemoryBookmarkRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.ts';
import { Bookmark } from '../model/bookmark.ts';
import {
  NoteBookmarkNotFoundError,
  NoteNotFoundError,
} from '../model/errors.ts';
import type { Note } from '../model/note.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { DeleteBookmarkService } from './deleteBookmark.ts';

const author = generateDummyAccount();
const note = generateDummyNote({
  authorID: author.getID(),
  content: 'Hello world',
});
const noteID = note.getID();
const accountID = generateDummyID<Account>();

describe('DeleteBookmarkService', () => {
  const noteRepository = new InMemoryNoteRepository([note]);
  const eventPublisher = {
    publishMany: vi.fn(async () => Result.ok(undefined)),
  } as const satisfies MockedObject<EventPublisher>;
  let bookmarkRepository: InMemoryBookmarkRepository;
  let service: DeleteBookmarkService;

  beforeEach(() => {
    bookmarkRepository = new InMemoryBookmarkRepository([
      Bookmark.reconstruct({ noteID, accountID }),
    ]);
    service = new DeleteBookmarkService(
      bookmarkRepository,
      noteRepository,
      eventPublisher,
    );
    eventPublisher.publishMany.mockClear();
  });

  it('should delete bookmark', async () => {
    const res = await service.handle(noteID, accountID);

    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.bookmark.deleted' }),
    ]);
    expect(
      Option.isNone(await bookmarkRepository.findByID({ noteID, accountID })),
    ).toBe(true);
  });

  it('if note not found, should return NoteNotFoundError', async () => {
    const res = await service.handle(generateDummyID<Note>(), accountID);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteNotFoundError);
    expect(eventPublisher.publishMany).not.toHaveBeenCalled();
  });

  it('if bookmark not found, should return NoteBookmarkNotFoundError', async () => {
    const res = await service.handle(noteID, generateDummyID<Account>());

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteBookmarkNotFoundError);
    expect(eventPublisher.publishMany).not.toHaveBeenCalled();
  });

  it('should fail when deleting the same bookmark twice', async () => {
    const first = await service.handle(noteID, accountID);
    expect(Result.isOk(first)).toBe(true);
    eventPublisher.publishMany.mockClear();

    const second = await service.handle(noteID, accountID);
    expect(Result.isErr(second)).toBe(true);
    expect(Result.unwrapErr(second)).toBeInstanceOf(NoteBookmarkNotFoundError);
    expect(eventPublisher.publishMany).not.toHaveBeenCalled();
  });
});
