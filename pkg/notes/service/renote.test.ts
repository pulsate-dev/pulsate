import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { RenoteService } from './renote.js';

const originalNote = Note.new({
  id: '2' as ID<NoteID>,
  authorID: '1' as ID<AccountID>,
  content: 'original note',
  contentsWarningComment: '',
  createdAt: new Date(),
  originalNoteID: Option.none(),
  sendTo: Option.none(),
  visibility: 'PUBLIC',
});
const repository = new InMemoryNoteRepository([originalNote]);
const service = new RenoteService(
  repository,
  new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
);

describe('RenoteService', () => {
  it('should create renote', async () => {
    const renote = await service.handle(
      '2' as ID<NoteID>,
      'renote',
      '',
      '1' as ID<AccountID>,
      'PUBLIC',
    );

    expect(Result.unwrap(renote).getContent()).toBe('renote');
    expect(Result.unwrap(renote).getCwComment()).toBe('');
    expect(Result.unwrap(renote).getOriginalNoteID()).toStrictEqual(
      Option.some('2' as ID<NoteID>),
    );
    expect(Result.unwrap(renote).getVisibility()).toBe('PUBLIC');
  });

  it('should not create renote with DIRECT visibility', async () => {
    const res = await service.handle(
      '2' as ID<NoteID>,
      'direct renote',
      '',
      '1' as ID<AccountID>,
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('if original note not found', async () => {
    const res = await service.handle(
      '3' as ID<NoteID>,
      'renote',
      '',
      '1' as ID<AccountID>,
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });
});
