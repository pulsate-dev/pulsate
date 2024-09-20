import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryAccountRepository } from '../../accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import { testMedium, testNSFWMedium } from '../../drive/testData/testData.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { FetchService } from './fetch.js';

const testNote = Note.new({
  id: '1' as NoteID,
  authorID: '3' as AccountID,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  attachmentFileID: ['300' as MediumID, '301' as MediumID],
  visibility: 'PUBLIC',
});
const deletedNote = Note.reconstruct({
  id: '2' as NoteID,
  authorID: '3' as AccountID,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  visibility: 'PUBLIC',
  attachmentFileID: [],
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const frozenUserNote = Note.reconstruct({
  id: '5' as NoteID,
  authorID: '4' as AccountID,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  visibility: 'PUBLIC',
  attachmentFileID: [],
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const testAccount = Account.reconstruct({
  id: '3' as AccountID,
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
  id: '4' as AccountID,
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
const noteAttachmentRepository = new InMemoryNoteAttachmentRepository(
  [testMedium, testNSFWMedium],
  [['1' as NoteID, ['300' as MediumID, '301' as MediumID]]],
);
const reactionRepository = new InMemoryReactionRepository();

const service = new FetchService(
  repository,
  dummyAccountModuleFacade,
  noteAttachmentRepository,
  reactionRepository,
);

describe('FetchService', () => {
  afterEach(() => accountRepository.reset());

  it('should fetch notes', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchAccount').mockImplementation(
      async () => {
        return Result.ok(testAccount);
      },
    );
    const res = await service.fetchNoteByID('1' as NoteID);

    expect(Option.isSome(res)).toBe(true);
    expect(res[1]).toStrictEqual(testNote);
  });

  it('note not found', async () => {
    const res = await service.fetchNoteByID('999' as NoteID);

    expect(Option.isNone(res)).toBe(true);
  });

  it('note deleted', async () => {
    const res = await service.fetchNoteByID(deletedNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });

  it('fetchMany: should fetch notes', async () => {
    const testNotes = [...new Array<Note>(5)].map((_, i) =>
      Note.new({
        id: i.toString() as NoteID,
        authorID: '3' as AccountID,
        content: `Hello world ${i}`,
        contentsWarningComment: '',
        createdAt: new Date('2023-09-10T00:00:00Z'),
        sendTo: Option.none(),
        originalNoteID: Option.none(),
        attachmentFileID: ['300' as MediumID, '301' as MediumID],
        visibility: 'PUBLIC',
      }),
    );
    testNotes.map(async (v) => await repository.create(v));
    console.log(testNotes.length);
    const res = await service.fetchNotesByID(testNotes.map((v) => v.getID()));
    console.log(res);
    expect(Result.isOk(res)).toBe(true);
    expect(res).toStrictEqual;
  });

  it('account frozen', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchAccount').mockImplementation(
      async () => {
        return Result.ok(frozenAccount);
      },
    );
    const res = await service.fetchNoteByID(frozenUserNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });

  it('should fetch note attachments', async () => {
    const res = await service.fetchNoteAttachments('1' as NoteID);
    expect(Result.isOk(res)).toBe(true);

    expect(Result.unwrap(res)).toStrictEqual([testMedium, testNSFWMedium]);
    expect(Result.unwrap(res)).toHaveLength(2);
  });
});
