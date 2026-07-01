import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import { Note, type NoteID } from './note.js';
import { getRenoteChainRootID } from './renoteDomainService.js';

const baseNoteArgs = {
  authorID: '101' as AccountID,
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
    id: '1' as NoteID,
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
    const note = reconstructNote({
      id: '2' as NoteID,
      originalNoteID: Option.some('1' as NoteID),
    });

    expect(getRenoteChainRootID(note)).toStrictEqual(
      Option.some('1' as NoteID),
    );
  });

  it('returns None for a quote (does not follow the chain)', () => {
    const quote = reconstructNote({
      id: '20' as NoteID,
      content: 'quoting!',
      originalNoteID: Option.some('2' as NoteID),
    });

    expect(quote.isQuote()).toBe(true);
    expect(getRenoteChainRootID(quote)).toStrictEqual(Option.none());
  });

  it('returns None for a quote with attachments (does not follow the chain)', () => {
    const quote = reconstructNote({
      id: '21' as NoteID,
      originalNoteID: Option.some('2' as NoteID),
      attachmentFileID: ['10' as MediumID],
    });

    expect(quote.isQuote()).toBe(true);
    expect(getRenoteChainRootID(quote)).toStrictEqual(Option.none());
  });
});
