import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryAccountRepository } from '../../accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { AccountModule } from '../../intermodule/account.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { FetchService } from './fetch.js';

const testNote = Note.new({
  id: '1' as ID<NoteID>,
  authorID: '3' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  visibility: 'PUBLIC',
});
const deletedNote = Note.reconstruct({
  id: '2' as ID<NoteID>,
  authorID: '3' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  visibility: 'PUBLIC',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const frozenUserNote = Note.reconstruct({
  id: '5' as ID<NoteID>,
  authorID: '4' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  visibility: 'PUBLIC',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const testAccount = Account.reconstruct({
  id: '3' as ID<AccountID>,
  bio: '',
  frozen: 'normal',
  mail: '',
  name: '@johndoe@example.com',
  nickname: '',
  passphraseHash: undefined,
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  deletedAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: undefined,
});
const frozenAccount = Account.reconstruct({
  id: '4' as ID<AccountID>,
  bio: '',
  frozen: 'frozen',
  mail: '',
  name: '@frozen@example.com',
  nickname: '',
  passphraseHash: undefined,
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  deletedAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: undefined,
});

const repository = new InMemoryNoteRepository([
  testNote,
  frozenUserNote,
  deletedNote,
]);
const accountRepository = new InMemoryAccountRepository([
  testAccount,
  frozenAccount,
]);
const accountModule = new AccountModule();
const service = new FetchService(repository, accountModule);

describe('FetchService', () => {
  afterEach(() => accountRepository.reset());

  it('should fetch notes', async () => {
    vi.spyOn(accountModule, 'fetchAccount').mockImplementation(async () => {
      return Result.ok(testAccount);
    });
    const res = await service.fetchNoteByID('1' as ID<NoteID>);

    expect(Option.isSome(res)).toBe(true);
    expect(res[1]).toStrictEqual(testNote);
  });

  it('note not found', async () => {
    const res = await service.fetchNoteByID('999' as ID<NoteID>);

    expect(Option.isNone(res)).toBe(true);
  });

  it('note deleted', async () => {
    const res = await service.fetchNoteByID(deletedNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });

  it('account frozen', async () => {
    vi.spyOn(accountModule, 'fetchAccount').mockImplementation(async () => {
      return Result.ok(frozenAccount);
    });
    const res = await service.fetchNoteByID(frozenUserNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });
});
