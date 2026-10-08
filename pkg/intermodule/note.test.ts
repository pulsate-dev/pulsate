import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../accounts/model/account.ts';
import { NoteNotFoundError } from '../notes/model/errors.ts';
import { Note, type NoteID } from '../notes/model/note.ts';
import { NoteModuleFacade, noteFetchServiceInstance } from './note.ts';

const note = Note.reconstruct({
  id: '1' as NoteID,
  authorID: '101' as AccountID,
  content: 'hello',
  contentsWarningComment: '',
  createdAt: new Date(),
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  updatedAt: Option.none(),
  deletedAt: Option.none(),
});

describe('NoteModuleFacade', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a note by ID', async () => {
    vi.spyOn(noteFetchServiceInstance, 'fetchNoteByID').mockResolvedValue(
      Option.some(note),
    );
    const facade = new NoteModuleFacade(
      noteFetchServiceInstance,
      {} as never,
      {} as never,
    );

    const result = await facade.fetchNoteByID(note.getID());

    expect(result).toStrictEqual(Result.ok(note));
  });

  it('returns NoteNotFoundError when the note cannot be fetched', async () => {
    vi.spyOn(noteFetchServiceInstance, 'fetchNoteByID').mockResolvedValue(
      Option.none(),
    );
    const facade = new NoteModuleFacade(
      noteFetchServiceInstance,
      {} as never,
      {} as never,
    );

    const result = await facade.fetchNoteByID(note.getID());

    expect(Result.isErr(result)).toBe(true);
    expect(Result.unwrapErr(result)).toBeInstanceOf(NoteNotFoundError);
  });
});
