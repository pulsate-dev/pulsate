import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { Medium, type MediumID } from '../../drive/model/medium.js';
import { SnowflakeIDGenerator } from '../../id/mod.js';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { RenoteService } from './renote.js';

const originalNote = Note.new({
  id: '2' as NoteID,
  authorID: '1' as AccountID,
  content: 'original note',
  contentsWarningComment: '',
  createdAt: new Date(),
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
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
const service = new RenoteService(
  repository,
  new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
  attachmentRepository,
);

describe('RenoteService', () => {
  it('should create renote', async () => {
    const renote = await service.handle(
      '2' as NoteID,
      'renote',
      '',
      '1' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.unwrap(renote).getContent()).toBe('renote');
    expect(Result.unwrap(renote).getCwComment()).toBe('');
    expect(Result.unwrap(renote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as NoteID),
    );
    expect(Result.unwrap(renote).getVisibility()).toBe('PUBLIC');
  });

  it('renote with attachments', async () => {
    const renote = await service.handle(
      '2' as NoteID,
      'renote',
      '',
      '1' as AccountID,
      ['10' as MediumID, '11' as MediumID],
      'PUBLIC',
    );

    expect(Result.unwrap(renote).getContent()).toBe('renote');
    expect(Result.unwrap(renote).getCwComment()).toBe('');
    expect(Result.unwrap(renote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as NoteID),
    );
    expect(Result.unwrap(renote).getVisibility()).toBe('PUBLIC');
  });

  it('renote attachment must be less than 16', async () => {
    const res = await service.handle(
      '2' as NoteID,
      'renote',
      '',
      '1' as AccountID,
      Array.from({ length: 17 }, (_, i) => i.toString() as MediumID),
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('should not create renote with DIRECT visibility', async () => {
    const res = await service.handle(
      '2' as NoteID,
      'direct renote',
      '',
      '1' as AccountID,
      [],
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if original note not found', async () => {
    const res = await service.handle(
      '3' as NoteID,
      'renote',
      '',
      '1' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if id generation failed', async () => {
    const dummyService = new RenoteService(
      repository,
      new SnowflakeIDGenerator(0, {
        now: () => BigInt(Date.UTC(0, 0, 0, 0)),
      }),
      attachmentRepository,
    );

    const res = await dummyService.handle(
      '3' as NoteID,
      'renote',
      '',
      '1' as AccountID,
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
      'renote',
      '',
      '1' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(new Error('error'));
  });
});
