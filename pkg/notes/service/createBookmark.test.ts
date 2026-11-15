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
import type { Note } from '../model/note.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { CreateBookmarkService } from './createBookmark.ts';

const author = generateDummyAccount();
const note = generateDummyNote({
  authorID: author.getID(),
  content: 'Hello world',
});
const anotherNote = generateDummyNote({
  authorID: author.getID(),
  content: 'Another note',
});
const noteID = note.getID();
const anotherNoteID = anotherNote.getID();
const accountID = generateDummyID<Account>();
const anotherAccountID = generateDummyID<Account>();

const noteRepository = new InMemoryNoteRepository([note, anotherNote]);
const bookmarkRepository = new InMemoryBookmarkRepository();
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const createBookmarkService = new CreateBookmarkService(
  bookmarkRepository,
  noteRepository,
  eventPublisher,
);

describe('CreateBookmarkService', () => {
  beforeEach(() => {
    bookmarkRepository.reset();
  });

  it('success to create bookmark', async () => {
    const res = await createBookmarkService.handle(noteID, accountID);

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(await bookmarkRepository.findByID({ noteID, accountID })),
    ).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.bookmark.created' }),
    ]);
  });

  it('fail to re-create bookmark from same account', async () => {
    await createBookmarkService.handle(noteID, accountID);
    const res = await createBookmarkService.handle(noteID, accountID);

    expect(Result.isErr(res)).toBe(true);
    expect(
      Option.isSome(await bookmarkRepository.findByID({ noteID, accountID })),
    ).toBe(true);
  });

  it('fail when note not found', async () => {
    const res = await createBookmarkService.handle(
      generateDummyID<Note>(),
      accountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('success to create bookmark for another note', async () => {
    const res = await createBookmarkService.handle(anotherNoteID, accountID);

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await bookmarkRepository.findByID({ noteID: anotherNoteID, accountID }),
      ),
    ).toBe(true);
  });

  it('success to create bookmark from another account', async () => {
    const res = await createBookmarkService.handle(noteID, anotherAccountID);

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(
        await bookmarkRepository.findByID({
          noteID,
          accountID: anotherAccountID,
        }),
      ),
    ).toBe(true);
  });
});
