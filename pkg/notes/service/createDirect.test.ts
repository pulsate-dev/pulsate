import { Result } from '@mikuroxina/mini-fn';
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
import type { Medium } from '../../drive/model/medium.ts';
import type { AccountModuleFacade } from '../../intermodule/account.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import type {
  DirectNoteAttachmentRepository,
  DirectNoteRepository,
} from '../model/repository.ts';
import { CreateDirectNoteService } from './createDirect.ts';

const author: Account = generateDummyAccount({
  name: '@author@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});

const recipient: Account = generateDummyAccount({
  name: '@recipient@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});

const mockDirectNoteRepo: DirectNoteRepository = {
  create: vi.fn().mockResolvedValue(Result.ok(undefined)),
  findByID: vi.fn(),
  findByRecipientID: vi.fn(),
  deleteByID: vi.fn(),
};

const mockDirectNoteAttachmentRepo: DirectNoteAttachmentRepository = {
  create: vi.fn().mockResolvedValue(Result.ok(undefined)),
  findByDirectNoteID: vi.fn(),
};

const mockAccountModule = {
  fetchAccount: vi.fn(),
} as unknown as AccountModuleFacade;
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;

const service = new CreateDirectNoteService({
  directNoteRepository: mockDirectNoteRepo,
  directNoteAttachmentRepository: mockDirectNoteAttachmentRepo,
  idGenerator: new SnowflakeIDGenerator(0, {
    now: () => BigInt(new Date('2023-10-10T00:00:00Z').getTime()),
  }),
  clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
  accountModule: mockAccountModule,
  eventPublisher,
});

describe('CreateDirectNoteService', () => {
  beforeEach(() => {
    vi.mocked(mockAccountModule.fetchAccount).mockResolvedValue(
      Result.ok(author),
    );
    vi.mocked(mockDirectNoteRepo.create).mockResolvedValue(
      Result.ok(undefined),
    );
    vi.mocked(mockDirectNoteAttachmentRepo.create).mockResolvedValue(
      Result.ok(undefined),
    );
  });

  it('should create a direct note', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const res = await service.handle(
      'Hello',
      '',
      author.getID(),
      recipient.getID(),
      [],
    );

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getContent()).toBe('Hello');
    expect(Result.unwrap(res).getAuthorID()).toBe(author.getID());
    expect(Result.unwrap(res).getRecipientID()).toBe(recipient.getID());
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.created' }),
    ]);
  });

  it('should return error when author not found', async () => {
    vi.mocked(mockAccountModule.fetchAccount).mockResolvedValueOnce(
      Result.err(new Error('not found')),
    );

    const res = await service.handle(
      'Hello',
      '',
      generateDummyID<Account>(),
      recipient.getID(),
      [],
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res).message).toBe('Author not found');
  });

  it('should return error when recipient not found', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.err(new Error('not found')));

    const res = await service.handle(
      'Hello',
      '',
      author.getID(),
      generateDummyID<Account>(),
      [],
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res).message).toBe('Recipient not found');
  });

  it('should return error when content exceeds 3000 chars', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const res = await service.handle(
      'a'.repeat(3001),
      '',
      author.getID(),
      recipient.getID(),
      [],
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res).name).toBe('DirectNoteContentLengthError');
  });

  it('should return error when too many attachments (>16)', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const res = await service.handle(
      'Hello',
      '',
      author.getID(),
      recipient.getID(),
      Array.from({ length: 17 }, () => generateDummyID<Medium>()),
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res).name).toBe(
      'DirectNoteTooManyAttachmentsError',
    );
  });

  it('should return error when content, cw comment, and attachments are all empty', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const res = await service.handle(
      '',
      '',
      author.getID(),
      recipient.getID(),
      [],
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res).name).toBe('DirectNoteContentLengthError');
  });

  it('should not call attachment repo when attachmentFileID is empty', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));
    vi.mocked(mockDirectNoteAttachmentRepo.create).mockClear();

    await service.handle('Hello', '', author.getID(), recipient.getID(), []);

    expect(mockDirectNoteAttachmentRepo.create).not.toHaveBeenCalled();
  });

  it('should call attachment repo when attachments are provided', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const attachments = [generateDummyID<Medium>(), generateDummyID<Medium>()];
    const res = await service.handle(
      'Hello',
      '',
      author.getID(),
      recipient.getID(),
      attachments,
    );

    expect(Result.isOk(res)).toBe(true);
    expect(mockDirectNoteAttachmentRepo.create).toHaveBeenCalled();
  });
});
