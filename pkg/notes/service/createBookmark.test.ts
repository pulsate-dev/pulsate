import { Result, Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { InMemoryBookmarkRepository } from '../adaptor/repository/dummy.js';
import type { NoteID } from '../model/note.js';
import { CreateBookmarkService } from './createBookmark.js';

const noteID = 'noteID_1' as ID<NoteID>;
const anotherNoteID = 'noteID_2' as ID<NoteID>;
const accountID = 'accountID_1' as ID<AccountID>;
const anotherAccountID = 'accountID_2' as ID<AccountID>;

const bookmarkRepository = new InMemoryBookmarkRepository();
const createBookmarkService = new CreateBookmarkService(bookmarkRepository);

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
