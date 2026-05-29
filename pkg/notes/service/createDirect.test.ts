import { Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Account, AccountID } from '../../accounts/model/account.js';
import { generateDummyAccount } from '../../accounts/testData/testData.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { AccountModuleFacade } from '../../intermodule/account.js';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.js';
import type {
  DirectNoteAttachmentRepository,
  DirectNoteRepository,
} from '../model/repository.js';
import { CreateDirectNoteService } from './createDirect.js';

const author: Account = generateDummyAccount({
  id: '1' as AccountID,
  name: '@author@example.com',
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  frozen: 'normal',
  createdAt: new Date('2023-09-10T00:00:00Z'),
});

const recipient: Account = generateDummyAccount({
  id: '2' as AccountID,
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
  findConversation: vi.fn(),
  deleteByID: vi.fn(),
};

const mockDirectNoteAttachmentRepo: DirectNoteAttachmentRepository = {
  create: vi.fn().mockResolvedValue(Result.ok(undefined)),
  findByDirectNoteID: vi.fn(),
};

const mockAccountModule = {
  fetchAccount: vi.fn(),
} as unknown as AccountModuleFacade;

const service = new CreateDirectNoteService({
  directNoteRepository: mockDirectNoteRepo,
  directNoteAttachmentRepository: mockDirectNoteAttachmentRepo,
  idGenerator: new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
  clock: new MockClock(new Date('2023-09-10T00:00:00Z')),
  accountModule: mockAccountModule,
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
      '1' as AccountID,
      '2' as AccountID,
      [],
    );

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getContent()).toBe('Hello');
    expect(Result.unwrap(res).getAuthorID()).toBe('1');
    expect(Result.unwrap(res).getRecipientID()).toBe('2');
  });

  it('should return error when author not found', async () => {
    vi.mocked(mockAccountModule.fetchAccount).mockResolvedValueOnce(
      Result.err(new Error('not found')),
    );

    const res = await service.handle(
      'Hello',
      '',
      '999' as AccountID,
      '2' as AccountID,
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
      '1' as AccountID,
      '999' as AccountID,
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
      '1' as AccountID,
      '2' as AccountID,
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
      '1' as AccountID,
      '2' as AccountID,
      Array.from({ length: 17 }, (_, i) => i.toString() as MediumID),
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
      '1' as AccountID,
      '2' as AccountID,
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

    await service.handle('Hello', '', '1' as AccountID, '2' as AccountID, []);

    expect(mockDirectNoteAttachmentRepo.create).not.toHaveBeenCalled();
  });

  it('should call attachment repo when attachments are provided', async () => {
    vi.mocked(mockAccountModule.fetchAccount)
      .mockResolvedValueOnce(Result.ok(author))
      .mockResolvedValueOnce(Result.ok(recipient));

    const attachments = ['10' as MediumID, '11' as MediumID];
    const res = await service.handle(
      'Hello',
      '',
      '1' as AccountID,
      '2' as AccountID,
      attachments,
    );

    expect(Result.isOk(res)).toBe(true);
    expect(mockDirectNoteAttachmentRepo.create).toHaveBeenCalled();
  });
});
