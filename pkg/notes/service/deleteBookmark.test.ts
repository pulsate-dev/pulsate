import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryBookmarkRepository } from '../adaptor/repository/dummy.ts';
import { Bookmark } from '../model/bookmark.ts';
import type { Note } from '../model/note.ts';
import { DeleteBookmarkService } from './deleteBookmark.ts';

const noteID = generateDummyID<Note>();
const accountID = generateDummyID<Account>();

const bookmarkRepository = new InMemoryBookmarkRepository([
  Bookmark.reconstruct({ noteID, accountID }),
]);
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
const deleteBookmarkService = new DeleteBookmarkService(
  bookmarkRepository,
  eventPublisher,
);

describe('DeleteBookmarkService', () => {
  it('should delete bookmark', async () => {
    const res = await deleteBookmarkService.handle(noteID, accountID);
    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.bookmark.deleted' }),
    ]);
  });

  it('should fail to delete bookmark when does not exist bookmark', async () => {
    const res = await deleteBookmarkService.handle(
      generateDummyID<Note>(),
      accountID,
    );
    expect(Result.isErr(res)).toBe(true);
  });
});
