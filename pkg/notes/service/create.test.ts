import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import {
  dummyNormalAccount1,
  dummyNormalAccount2,
  dummySilencedAccount,
} from '../../accounts/testData/testData.ts';
import type { Medium } from '../../drive/model/medium.ts';
import { generateDummyMedium } from '../../drive/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyIDs } from '../../internal/id/dummy.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.ts';
import { NoteAccountSilencedError } from '../model/errors.ts';
import { CreateService } from './create.ts';

const noteRepository = new InMemoryNoteRepository();
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
const createService = new CreateService({
  noteRepository,
  idGenerator: new SnowflakeIDGenerator(0, {
    now: () => BigInt(new Date('2023-10-10T00:00:00Z').getTime()),
  }),
  noteAttachmentRepository: attachmentRepository,
  accountModule: dummyAccountModuleFacade,
  clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
  eventPublisher,
});

describe('CreateService', () => {
  it('waits for event publication before completing', async () => {
    let release: ((result: Result.Result<Error, void>) => void) | undefined;
    const pending = new Promise<Result.Result<Error, void>>((resolve) => {
      release = resolve;
    });
    const publisher = vi
      .spyOn(eventPublisher, 'publishMany')
      .mockImplementationOnce(() => pending);
    let completed = false;
    const creation = createService
      .handle('Hello world', '', dummyNormalAccount2.getID(), [], 'PUBLIC')
      .then((result) => {
        completed = true;
        return result;
      });

    try {
      await vi.waitFor(() => expect(publisher).toHaveBeenCalled());
      expect(completed).toBe(false);
    } finally {
      release?.(Result.ok(undefined));
    }
    expect(Result.isOk(await creation)).toBe(true);
    publisher.mockRestore();
  });

  it('should create a note', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount2.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.created' }),
    ]);
  });

  it('does not fail note creation when event publication fails', async () => {
    eventPublisher.publishMany.mockResolvedValueOnce(
      Result.err(new Error('event transport unavailable')),
    );

    const result = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount2.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isOk(result)).toBe(true);
  });

  it('does not create attachments when none are provided', async () => {
    const attachmentCreateSpy = vi.spyOn(attachmentRepository, 'create');

    const res = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount2.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(attachmentCreateSpy).not.toHaveBeenCalled();
  });

  it('with attachments', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount2.getID(),
      attachments.slice(0, 2).map((v) => v.getId()),
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
  });

  it('note attachment must be less than 16', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount1.getID(),
      generateDummyIDs<Medium>(17),
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('note content must be less than 3000 chars', async () => {
    const res = await createService.handle(
      'a'.repeat(3001),
      '',
      dummyNormalAccount1.getID(),
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('visibility DIRECT is rejected', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      dummyNormalAccount1.getID(),
      [],
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if actor silenced, must not set PUBLIC', async () => {
    const publicRes = await createService.handle(
      'Hello world',
      '',
      dummySilencedAccount.getID(),
      [],
      'PUBLIC',
    );
    expect(Result.isErr(publicRes)).toBe(true);
    expect(Result.unwrapErr(publicRes)).toBeInstanceOf(
      NoteAccountSilencedError,
    );

    const homeRes = await createService.handle(
      'Hello world',
      '',
      dummySilencedAccount.getID(),
      [],
      'HOME',
    );
    expect(Result.isOk(homeRes)).toBe(true);
  });
});
