import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { Note, type NoteID } from '../../notes/model/note.js';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from '../adaptor/repository/dummyCache.js';
import type { ListID } from '../model/list.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { ListTimelineService } from './list.js';

describe('ListTimelineService', () => {
  const sameTimePublicNote = Note.reconstruct({
    id: '10' as NoteID,
    authorID: dummyPublicNote.getAuthorID(),
    content: dummyPublicNote.getContent(),
    visibility: dummyPublicNote.getVisibility(),
    contentsWarningComment: dummyPublicNote.getCwComment(),
    sendTo: dummyPublicNote.getSendTo(),
    originalNoteID: dummyPublicNote.getOriginalNoteID(),
    attachmentFileID: dummyPublicNote.getAttachmentFileID(),
    createdAt: dummyPublicNote.getCreatedAt(),
    updatedAt: dummyPublicNote.getUpdatedAt(),
    deletedAt: dummyPublicNote.getDeletedAt(),
  });
  const cache = new InMemoryTimelineCacheRepository();
  cache.addNotesToList('1' as ListID, [
    dummyPublicNote,
    dummyHomeNote,
    sameTimePublicNote,
  ]);
  const repository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
    sameTimePublicNote,
  ]);
  const service = new ListTimelineService(cache, repository);

  it('should fetch list timeline notes', async () => {
    const res = await service.handle('1' as ListID);
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toHaveLength(2);
    expect(Result.unwrap(res)).toStrictEqual([dummyHomeNote, dummyPublicNote]);
  });

  it('should notes sorted by createdAt, descending', async () => {
    const res = await service.handle('1' as ListID);
    /* NOTE: after ECMAScript 2019, Array.prototype.sort() is stable sort.
     * So, if two elements have the same createdAt, the order of the elements.
     */
    const sorted = [dummyPublicNote, dummyHomeNote, sameTimePublicNote].sort(
      (a, b) => b.getCreatedAt().getDate() - a.getCreatedAt().getDate(),
    );
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual(sorted);
  });
});
