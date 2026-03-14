import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { Medium, type MediumID } from '../../drive/model/medium.js';
import { MockClock, SnowflakeIDGenerator } from '../../id/mod.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import { dummyTimelineModuleFacade } from '../../intermodule/timeline.js';
import { InMemoryTimelineCacheRepository } from '../../timeline/adaptor/repository/dummyCache.js';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.js';
import {
  NoteInsufficientPermissionError,
  NoteVisibilityInvalidError,
} from '../model/errors.js';
import { Note, type NoteID } from '../model/note.js';
import { RenoteService } from './renote.js';

const originalNote = Note.reconstruct({
  id: '2' as NoteID,
  authorID: '101' as AccountID,
  content: 'original note',
  contentsWarningComment: '',
  createdAt: new Date(),
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  updatedAt: Option.none(),
  deletedAt: Option.none(),
});
const repository = new InMemoryNoteRepository([originalNote]);
const attachmentRepository = new InMemoryNoteAttachmentRepository(
  Array.from({ length: 16 }, (_, i) => {
    return Medium.reconstruct({
      id: (i + 10).toString() as MediumID,
      name: (i + 10).toString(),
      mime: 'image/png',
      hash: 'ewkjnfgr]g:ge+ealksmc',
      url: '',
      thumbnailUrl: '',
      nsfw: false,
      authorId: '1' as AccountID,
    });
  }),
  [],
);
const timelineCacheRepository = new InMemoryTimelineCacheRepository();
const service = new RenoteService({
  noteRepository: repository,
  idGenerator: new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
  noteAttachmentRepository: attachmentRepository,
  accountModule: dummyAccountModuleFacade,
  timelineModule: dummyTimelineModuleFacade(timelineCacheRepository),
  clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
});

describe('RenoteService', () => {
  it('should create renote', async () => {
    const renote = await service.handle(
      '2' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );
    expect(Result.unwrap(renote).getContent()).toBe('');
    expect(Result.unwrap(renote).getCwComment()).toBe('');
    expect(Result.unwrap(renote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as NoteID),
    );
    expect(Result.unwrap(renote).getVisibility()).toBe('PUBLIC');
    expect(Result.unwrap(renote).isRenote()).toBe(true);
    expect(Result.unwrap(renote).isQuote()).toBe(false);
  });

  it('should push renote to timeline', async () => {
    const cacheRepo = new InMemoryTimelineCacheRepository();
    const timelineModule = dummyTimelineModuleFacade(cacheRepo);
    const pushSpy = vi.spyOn(timelineModule, 'pushNoteToTimeline');

    const testService = new RenoteService({
      noteRepository: repository,
      idGenerator: new SnowflakeIDGenerator(0, {
        now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
      }),
      noteAttachmentRepository: attachmentRepository,
      accountModule: dummyAccountModuleFacade,
      timelineModule,
      clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
    });

    const renote = await testService.handle(
      '2' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isOk(renote)).toBe(true);
    expect(pushSpy).toHaveBeenCalledWith(Result.unwrap(renote));
  });

  it('should create quote when content is provided', async () => {
    const quote = await service.handle(
      '2' as NoteID,
      'quoting this!',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );
    expect(Result.unwrap(quote).getContent()).toBe('quoting this!');
    expect(Result.unwrap(quote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as NoteID),
    );
    expect(Result.unwrap(quote).isRenote()).toBe(true);
    expect(Result.unwrap(quote).isQuote()).toBe(true);
  });

  it('renote with attachments creates quote', async () => {
    const quote = await service.handle(
      '2' as NoteID,
      '',
      '',
      '101' as AccountID,
      ['10' as MediumID, '11' as MediumID],
      'PUBLIC',
    );

    expect(Result.unwrap(quote).getContent()).toBe('');
    expect(Result.unwrap(quote).getCwComment()).toBe('');
    expect(Result.unwrap(quote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as NoteID),
    );
    expect(Result.unwrap(quote).getVisibility()).toBe('PUBLIC');
    expect(Result.unwrap(quote).isQuote()).toBe(true);
  });

  it('renote attachment must be less than 16', async () => {
    await expect(
      service.handle(
        '2' as NoteID,
        '',
        '',
        '101' as AccountID,
        Array.from({ length: 17 }, (_, i) => i.toString() as MediumID),
        'PUBLIC',
      ),
    ).rejects.toThrow('Too many attachments');
  });

  it('should not create renote with DIRECT visibility', async () => {
    const res = await service.handle(
      '2' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if original note not found', async () => {
    const res = await service.handle(
      '3' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('should not be able to renote DIRECT notes', async () => {
    const originalDIRECTNote = Note.reconstruct({
      id: '3' as NoteID,
      authorID: '101' as AccountID,
      content: 'original note',
      contentsWarningComment: '',
      createdAt: new Date(),
      originalNoteID: Option.none(),
      attachmentFileID: [],
      sendTo: Option.some('102' as AccountID),
      visibility: 'DIRECT',
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
    await repository.create(originalDIRECTNote);
    const res = await service.handle(
      originalDIRECTNote.getID(),
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new NoteVisibilityInvalidError('Can not renote direct note', {
        cause: null,
      }),
    );
  });

  it('should not be able to renote others FOLLOWERS notes', async () => {
    const originalFOLLOWRSNote = Note.reconstruct({
      id: '4' as NoteID,
      authorID: '102' as AccountID,
      content: 'original note',
      contentsWarningComment: '',
      createdAt: new Date(),
      originalNoteID: Option.none(),
      attachmentFileID: [],
      sendTo: Option.none(),
      visibility: 'FOLLOWERS',
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
    await repository.create(originalFOLLOWRSNote);

    const res = await service.handle(
      '4' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new NoteVisibilityInvalidError('Can not renote others FOLLOWERS note', {
        cause: null,
      }),
    );
  });

  it('should reject renoting a renote whose original is FOLLOWERS note by other account', async () => {
    const followersNote = Note.reconstruct({
      id: '10' as NoteID,
      authorID: '102' as AccountID,
      content: 'followers only',
      contentsWarningComment: '',
      createdAt: new Date(),
      originalNoteID: Option.none(),
      attachmentFileID: [],
      sendTo: Option.none(),
      visibility: 'FOLLOWERS',
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
    // renote of followersNote by the author (visibility doesn't matter for resolve)
    const renoteOfFollowers = Note.reconstruct({
      id: '11' as NoteID,
      authorID: '102' as AccountID,
      content: '',
      contentsWarningComment: '',
      createdAt: new Date(),
      originalNoteID: Option.some('10' as NoteID),
      attachmentFileID: [],
      sendTo: Option.none(),
      visibility: 'PUBLIC',
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
    await repository.create(followersNote);
    await repository.create(renoteOfFollowers);

    const res = await service.handle(
      '11' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new NoteVisibilityInvalidError('Can not renote others FOLLOWERS note', {
        cause: null,
      }),
    );
  });

  it('should renote a quote and refer to the quote itself (not the original)', async () => {
    const quoteNote = Note.reconstruct({
      id: '20' as NoteID,
      authorID: '102' as AccountID,
      content: 'quoting!',
      contentsWarningComment: '',
      createdAt: new Date(),
      originalNoteID: Option.some('2' as NoteID),
      attachmentFileID: [],
      sendTo: Option.none(),
      visibility: 'PUBLIC',
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
    await repository.create(quoteNote);

    const res = await service.handle(
      '20' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    // NOTE: 2 <-Quotes- 20 <-Renotes- result => result's original is 20 (not 2)
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getOriginalNoteID()).toStrictEqual(
      Option.some('20' as NoteID),
    );
    expect(Result.unwrap(res).isRenote()).toBe(true);
    expect(Result.unwrap(res).isQuote()).toBe(false);
  });

  it("if actor frozen, can't renote", async () => {
    const res = await service.handle(
      originalNote.getID(),
      'renote',
      '',
      '104' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new NoteInsufficientPermissionError('Not allowed', { cause: null }),
    );
  });

  it('if actor silenced, renote must not set PUBLIC', async () => {
    const publicRes = await service.handle(
      originalNote.getID(),
      'renote',
      '',
      '105' as AccountID,
      [],
      'PUBLIC',
    );
    expect(Result.isErr(publicRes)).toBe(true);
    expect(Result.unwrapErr(publicRes)).toStrictEqual(
      new NoteInsufficientPermissionError('Not allowed', { cause: null }),
    );

    const homeRes = await service.handle(
      originalNote.getID(),
      'renote',
      '',
      '105' as AccountID,
      [],
      'HOME',
    );
    expect(Result.isOk(homeRes)).toBe(true);
  });

  it('if id generation failed', async () => {
    const dummyService = new RenoteService({
      noteRepository: repository,
      idGenerator: new SnowflakeIDGenerator(0, {
        now: () => BigInt(Date.UTC(0, 0, 0, 0, 0)),
      }),
      noteAttachmentRepository: attachmentRepository,
      accountModule: dummyAccountModuleFacade,
      timelineModule: dummyTimelineModuleFacade(
        new InMemoryTimelineCacheRepository(),
      ),
      clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
    });

    const res = await dummyService.handle(
      '3' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if repository renote creation failed', async () => {
    vi.spyOn(repository, 'create').mockImplementation(async () =>
      Result.err(new Error('error')),
    );

    const res = await service.handle(
      '2' as NoteID,
      '',
      '',
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(new Error('error'));
  });
});
