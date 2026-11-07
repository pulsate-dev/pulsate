import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryAccountRepository } from '../../accounts/adaptor/repository/dummy/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { testMedium, testNSFWMedium } from '../../drive/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.ts';
import type { Note } from '../model/note.ts';
import { generateDummyNote, generateDummyNotes } from '../testData/testData.ts';
import { FetchService } from './fetch.ts';

const testAccount = generateDummyAccount({
  name: '@johndoe@example.com',
  deletedAt: new Date('2024-01-01T00:00:00Z'),
});
const frozenAccount = generateDummyAccount({
  name: '@frozen@example.com',
  frozen: 'frozen',
  deletedAt: new Date('2024-01-01T00:00:00Z'),
});
const testNote = generateDummyNote({
  authorID: testAccount.getID(),
  content: 'Hello world',
  attachmentFileID: [testMedium.getId(), testNSFWMedium.getId()],
});
const deletedNote = generateDummyNote({
  authorID: testAccount.getID(),
  content: 'Hello world',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
});
const frozenUserNote = generateDummyNote({
  authorID: frozenAccount.getID(),
  content: 'Hello world',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
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
  [[testNote.getID(), [testMedium.getId(), testNSFWMedium.getId()]]],
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
    const res = await service.fetchNoteByID(testNote.getID());

    expect(Option.isSome(res)).toBe(true);
    expect(res[1]).toStrictEqual(testNote);
  });

  it('note not found', async () => {
    const res = await service.fetchNoteByID(generateDummyID<Note>());

    expect(Option.isNone(res)).toBe(true);
  });

  it('note deleted', async () => {
    const res = await service.fetchNoteByID(deletedNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });

  it('fetchMany: should fetch notes', async () => {
    const testNotes = generateDummyNotes(5, (i) => ({
      authorID: testAccount.getID(),
      content: `Hello world ${i}`,
      attachmentFileID: [testMedium.getId(), testNSFWMedium.getId()],
    }));
    await Promise.all(testNotes.map((v) => repository.create(v)));
    const res = await service.fetchNotesByID(testNotes.map((v) => v.getID()));
    expect(Result.isOk(res)).toBe(true);

    const fetchedIDs = Result.unwrap(res)
      .map((v) => v.getID())
      .sort();
    expect(fetchedIDs).toStrictEqual(testNotes.map((v) => v.getID()).sort());
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
    const res = await service.fetchNoteAttachments(testNote.getID());
    expect(Result.isOk(res)).toBe(true);

    expect(Result.unwrap(res)).toStrictEqual([testMedium, testNSFWMedium]);
    expect(Result.unwrap(res)).toHaveLength(2);
  });
});
