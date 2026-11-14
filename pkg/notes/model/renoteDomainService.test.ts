import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import type { Medium } from '../../drive/model/medium.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { Note } from './note.ts';
import { getRenoteChainRootID } from './renoteDomainService.ts';

const authorID = generateDummyID<Account>();

const baseNoteArgs = {
  authorID,
  content: '',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  sendTo: Option.none(),
  attachmentFileID: [],
  visibility: 'PUBLIC' as const,
  updatedAt: Option.none(),
  deletedAt: Option.none(),
};

const reconstructNote = (
  overrides: Partial<Parameters<typeof Note.reconstruct>[0]>,
): Note =>
  Note.reconstruct({
    id: generateDummyID<Note>(),
    ...baseNoteArgs,
    originalNoteID: Option.none(),
    ...overrides,
  });

describe('getRenoteChainRootID', () => {
  it('returns None for an ordinary note', () => {
    const note = reconstructNote({ originalNoteID: Option.none() });

    expect(getRenoteChainRootID(note)).toStrictEqual(Option.none());
  });

  it('returns the original NoteID for a pure renote (follow the chain one hop)', () => {
    const originalNoteID = generateDummyID<Note>();
    const note = reconstructNote({
      originalNoteID: Option.some(originalNoteID),
    });

    expect(getRenoteChainRootID(note)).toStrictEqual(
      Option.some(originalNoteID),
    );
  });

  it('returns None for a quote (does not follow the chain)', () => {
    const quote = reconstructNote({
      content: 'quoting!',
      originalNoteID: Option.some(generateDummyID<Note>()),
    });

    expect(quote.isQuote()).toBe(true);
    expect(getRenoteChainRootID(quote)).toStrictEqual(Option.none());
  });

  it('returns None for a quote with attachments (does not follow the chain)', () => {
    const quote = reconstructNote({
      originalNoteID: Option.some(generateDummyID<Note>()),
      attachmentFileID: [generateDummyID<Medium>()],
    });

    expect(quote.isQuote()).toBe(true);
    expect(getRenoteChainRootID(quote)).toStrictEqual(Option.none());
  });
});
