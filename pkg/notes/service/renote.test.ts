import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, type MockedObject, vi } from 'vitest';
import {
  dummyFrozenAccount,
  dummyNormalAccount1,
  dummyNormalAccount2,
  dummySilencedAccount,
} from '../../accounts/testData/testData.ts';
import type { Medium } from '../../drive/model/medium.ts';
import { generateDummyMedium } from '../../drive/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID, generateDummyIDs } from '../../internal/id/dummy.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.ts';
import {
  NoteInsufficientPermissionError,
  NoteVisibilityInvalidError,
} from '../model/errors.ts';
import type { Note } from '../model/note.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { RenoteService } from './renote.ts';

const originalNote = generateDummyNote({
  authorID: dummyNormalAccount1.getID(),
  content: 'original note',
});
const repository = new InMemoryNoteRepository([originalNote]);
const attachments = Array.from({ length: 16 }, () =>
  generateDummyMedium({ mime: 'image/png', nsfw: false }),
);
const attachmentRepository = new InMemoryNoteAttachmentRepository(
  attachments,
  [],
);
const eventPublisher = {
  publishMany: vi.fn<EventPublisher['publishMany']>(async () =>
    Result.ok(undefined),
  ),
} as const satisfies MockedObject<EventPublisher>;
const service = new RenoteService({
  noteRepository: repository,
  idGenerator: new SnowflakeIDGenerator(0, {
    now: () => BigInt(new Date('2023-10-10T00:00:00Z').getTime()),
  }),
  noteAttachmentRepository: attachmentRepository,
  accountModule: dummyAccountModuleFacade,
  clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
  eventPublisher,
});

describe('RenoteService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create renote', async () => {
    const renote = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );
    expect(Result.unwrap(renote).getContent()).toBe('');
    expect(Result.unwrap(renote).getCwComment()).toBe('');
    expect(Result.unwrap(renote).getOriginalNoteID()).toStrictEqual(
      Option.some(originalNote.getID()),
    );
    expect(Result.unwrap(renote).getVisibility()).toBe('PUBLIC');
    expect(Result.unwrap(renote).isRenote()).toBe(true);
    expect(Result.unwrap(renote).isQuote()).toBe(false);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.renoted' }),
    ]);
  });

  it('does not fail renote creation when event publication fails', async () => {
    const error = new Error('event transport unavailable');
    eventPublisher.publishMany.mockResolvedValueOnce(Result.err(error));

    const result = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isOk(result)).toBe(true);
  });

  it('should create quote when content is provided', async () => {
    const quote = await service.handle(
      originalNote.getID(),
      'quoting this!',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );
    expect(Result.unwrap(quote).getContent()).toBe('quoting this!');
    expect(Result.unwrap(quote).getOriginalNoteID()).toStrictEqual(
      Option.some(originalNote.getID()),
    );
    expect(Result.unwrap(quote).isRenote()).toBe(true);
    expect(Result.unwrap(quote).isQuote()).toBe(true);
  });

  it('renote with attachments creates quote', async () => {
    const quote = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      attachments.slice(0, 2).map((v) => v.getId()),
      'PUBLIC',
    );

    expect(Result.unwrap(quote).getContent()).toBe('');
    expect(Result.unwrap(quote).getCwComment()).toBe('');
    expect(Result.unwrap(quote).getOriginalNoteID()).toStrictEqual(
      Option.some(originalNote.getID()),
    );
    expect(Result.unwrap(quote).getVisibility()).toBe('PUBLIC');
    expect(Result.unwrap(quote).isQuote()).toBe(true);
  });

  it('renote attachment must be less than 16', async () => {
    const res = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      generateDummyIDs<Medium>(17),
      'PUBLIC',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should not create renote with DIRECT visibility', async () => {
    const res = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteVisibilityInvalidError);
  });

  it('if original note not found', async () => {
    const res = await service.handle(
      generateDummyID<Note>(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('rejects invalid renote visibility', async () => {
    const res = await service.handle(
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'FOLLOWERS',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteVisibilityInvalidError);
  });

  it('should not be able to renote others FOLLOWERS notes', async () => {
    const originalFOLLOWRSNote = generateDummyNote({
      authorID: dummyNormalAccount2.getID(),
      content: 'original note',
      visibility: 'FOLLOWERS',
    });
    await repository.create(originalFOLLOWRSNote);

    const res = await service.handle(
      originalFOLLOWRSNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
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
    const followersNote = generateDummyNote({
      authorID: dummyNormalAccount2.getID(),
      content: 'followers only',
      visibility: 'FOLLOWERS',
    });
    // renote of followersNote by the author (visibility doesn't matter for resolve)
    const renoteOfFollowers = generateDummyNote({
      authorID: dummyNormalAccount2.getID(),
      content: '',
      originalNoteID: Option.some(followersNote.getID()),
    });
    await repository.create(followersNote);
    await repository.create(renoteOfFollowers);

    const res = await service.handle(
      renoteOfFollowers.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
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
    const quoteNote = generateDummyNote({
      authorID: dummyNormalAccount2.getID(),
      content: 'quoting!',
      originalNoteID: Option.some(originalNote.getID()),
    });
    await repository.create(quoteNote);

    const res = await service.handle(
      quoteNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );

    // NOTE: 2 <-Quotes- 20 <-Renotes- result => result's original is 20 (not 2)
    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getOriginalNoteID()).toStrictEqual(
      Option.some(quoteNote.getID()),
    );
    expect(Result.unwrap(res).isRenote()).toBe(true);
    expect(Result.unwrap(res).isQuote()).toBe(false);
  });

  it("if actor frozen, can't renote", async () => {
    const res = await service.handle(
      originalNote.getID(),
      'renote',
      '',
      dummyFrozenAccount.getID(),
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
      dummySilencedAccount.getID(),
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
      dummySilencedAccount.getID(),
      [],
      'HOME',
    );
    expect(Result.isOk(homeRes)).toBe(true);
  });

  it('if id generation failed', async () => {
    const dummyService = new RenoteService({
      noteRepository: repository,
      idGenerator: new SnowflakeIDGenerator(0, {
        now: () => BigInt(new Date('1899-12-31T00:00:00Z').getTime()),
      }),
      noteAttachmentRepository: attachmentRepository,
      accountModule: dummyAccountModuleFacade,
      clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
      eventPublisher,
    });

    const res = await dummyService.handle(
      generateDummyID<Note>(),
      '',
      '',
      dummyNormalAccount1.getID(),
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
      originalNote.getID(),
      '',
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(new Error('error'));
  });
});
