import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import {
  InMemoryBookmarkRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { CreateBookmarkService } from './createBookmark.js';

const noteID = 'noteID_1' as NoteID;
const anotherNoteID = 'noteID_2' as NoteID;
const accountID = 'accountID_1' as AccountID;
const anotherAccountID = 'accountID_2' as AccountID;

const bookmarkRepository = new InMemoryBookmarkRepository();
const noteRepository = new InMemoryNoteRepository([
  Note.new({
    id: 'noteID_1' as NoteID,
    authorID: '3' as AccountID,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-10T00:00:00Z'),
    sendTo: Option.none(),
    originalNoteID: Option.none(),
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
    visibility: 'PUBLIC',
  }),
]);
const createBookmarkService = new CreateBookmarkService(
  bookmarkRepository,
  noteRepository,
);

describe('CreateBookmarkService', () => {
  it('success to create bookmark', async () => {
    const res = await createBookmarkService.handle(noteID, accountID);

    expect(Result.isOk(res)).toBe(true);
    expect(
      Option.isSome(await bookmarkRepository.findByID({ noteID, accountID })),
    ).toBe(true);
  });

  it('fail to re-create bookmark from same account', async () => {
    const res = await createBookmarkService.handle(noteID, accountID);

    expect(Result.isErr(res)).toBe(true);
    expect(
      Option.isSome(await bookmarkRepository.findByID({ noteID, accountID })),
    ).toBe(true);
  });

  it('fail when note not found', async () => {
    const res = await createBookmarkService.handle(
      'note_notexist' as NoteID,
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
