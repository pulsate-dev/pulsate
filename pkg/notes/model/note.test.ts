import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import { type CreateNoteArgs, Note, type NoteID } from './note.js';

const exampleInput: CreateNoteArgs = {
  id: '1' as NoteID,
  authorID: '2' as AccountID,
  content: 'hello world!',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  visibility: 'PUBLIC',
  contentsWarningComment: '',
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  attachmentFileID: ['10' as MediumID, '20' as MediumID, '30' as MediumID],
  updatedAt: Option.none(),
  deletedAt: Option.none(),
};

describe('Note', () => {
  it('generate new instance', () => {
    const note = Result.unwrap(Note.new(exampleInput));
    expect(note.getID()).toBe(exampleInput.id);
    expect(note.getAuthorID()).toBe(exampleInput.authorID);
    expect(note.getContent()).toBe(exampleInput.content);
    expect(note.getVisibility()).toBe(exampleInput.visibility);
    expect(note.getCwComment()).toBe(exampleInput.contentsWarningComment);
    expect(note.getAttachmentFileID()).toBe(exampleInput.attachmentFileID);
    expect(note.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(note.getUpdatedAt()).toStrictEqual(Option.none());
    expect(note.getDeletedAt()).toStrictEqual(Option.none());
  });

  it.each([
    {
      title: 'content exactly 3000 chars',
      args: { ...exampleInput, content: 'a'.repeat(3000) },
      isOk: true,
    },
    {
      title: 'content over 3000 chars',
      args: { ...exampleInput, content: 'a'.repeat(3001) },
      isOk: false,
    },
    {
      title: 'content empty',
      args: {
        ...exampleInput,
        content: '',
        contentsWarningComment: '',
        attachmentFileID: [] as MediumID[],
      },
      isOk: false,
    },
    {
      title: 'contentsWarningComment exactly 256 chars',
      args: { ...exampleInput, contentsWarningComment: 'a'.repeat(256) },
      isOk: true,
    },
    {
      title: 'contentsWarningComment over 256 chars',
      args: { ...exampleInput, contentsWarningComment: 'a'.repeat(257) },
      isOk: false,
    },
    {
      title: 'attachmentFileID exactly 16 items',
      args: {
        ...exampleInput,
        attachmentFileID: Array.from(
          { length: 16 },
          (_, i) => (i + 1).toString() as MediumID,
        ),
      },
      isOk: true,
    },
    {
      title: 'attachmentFileID over 16 items',
      args: {
        ...exampleInput,
        attachmentFileID: Array.from(
          { length: 17 },
          (_, i) => (i + 1).toString() as MediumID,
        ),
      },
      isOk: false,
    },
    {
      title: 'visibility DIRECT with sendTo None',
      args: {
        ...exampleInput,
        visibility: 'DIRECT' as const,
        sendTo: Option.none(),
      },
      isOk: false,
    },
    {
      title: 'visibility DIRECT with sendTo Some',
      args: {
        ...exampleInput,
        visibility: 'DIRECT' as const,
        sendTo: Option.some('99' as AccountID),
      },
      isOk: true,
    },
  ])('Note.new: $title', ({ args, isOk }) => {
    const result = Note.new(args);
    expect(Result.isOk(result)).toBe(isOk);
  });

  it('should allow empty content for renote (originalNoteID is Some)', () => {
    const result = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: '',
      attachmentFileID: [],
      originalNoteID: Option.some('999' as NoteID),
    });
    expect(Result.isOk(result)).toBe(true);

    const renote = Result.unwrap(result);
    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(0);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with CW comment', () => {
    const result = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: 'CW text',
      attachmentFileID: [],
      originalNoteID: Option.some('999' as NoteID),
    });
    expect(Result.isOk(result)).toBe(true);

    const renote = Result.unwrap(result);
    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('CW text');
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with attachments', () => {
    const result = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: '',
      attachmentFileID: ['10' as MediumID, '11' as MediumID],
      originalNoteID: Option.some('999' as NoteID),
    });
    expect(Result.isOk(result)).toBe(true);

    const renote = Result.unwrap(result);
    expect(renote.getContent()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(2);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  describe('quote', () => {
    it('should create a quote with content', () => {
      const result = Note.new({
        id: '200' as NoteID,
        authorID: '3' as AccountID,
        content: 'quoting this!',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        originalNoteID: Option.some('100' as NoteID),
        attachmentFileID: [],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });
      expect(Result.isOk(result)).toBe(true);

      const quote = Result.unwrap(result);
      expect(quote.getContent()).toBe('quoting this!');
      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
      expect(quote.isRenote()).toBe(true);
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with CW comment only', () => {
      const result = Note.new({
        id: '201' as NoteID,
        authorID: '3' as AccountID,
        content: '',
        visibility: 'PUBLIC',
        contentsWarningComment: 'CW text',
        sendTo: Option.none(),
        originalNoteID: Option.some('100' as NoteID),
        attachmentFileID: [],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });
      expect(Result.isOk(result)).toBe(true);

      const quote = Result.unwrap(result);
      expect(quote.getContent()).toBe('');
      expect(quote.getCwComment()).toBe('CW text');
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with attachments only', () => {
      const result = Note.new({
        id: '202' as NoteID,
        authorID: '3' as AccountID,
        content: '',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        originalNoteID: Option.some('100' as NoteID),
        attachmentFileID: ['10' as MediumID],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });
      expect(Result.isOk(result)).toBe(true);

      const quote = Result.unwrap(result);
      expect(quote.getContent()).toBe('');
      expect(quote.getAttachmentFileID()).toHaveLength(1);
      expect(quote.isQuote()).toBe(true);
    });

    it('should refer to original note when quoting a renote', () => {
      /**
       * NOTE:
       * originalNoteID resolution (renote chain traversal) is handled
       * by the service layer (resolveOriginalNote), not by Note.new().
       * Note.new() simply stores the originalNoteID as given.
       */
      const result = Note.new({
        id: '301' as NoteID,
        authorID: '4' as AccountID,
        content: 'quoting a renote',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        originalNoteID: Option.some('100' as NoteID),
        attachmentFileID: [],
        createdAt: new Date('2023-09-12T00:00:00.000Z'),
      });
      expect(Result.isOk(result)).toBe(true);

      const quote = Result.unwrap(result);
      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
    });

    it('should refer to the quote itself when quoting a quote', () => {
      const result = Note.new({
        id: '301' as NoteID,
        authorID: '4' as AccountID,
        content: 'quoting a quote',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        originalNoteID: Option.some('300' as NoteID),
        attachmentFileID: [],
        createdAt: new Date('2023-09-12T00:00:00.000Z'),
      });
      expect(Result.isOk(result)).toBe(true);

      const quote301 = Result.unwrap(result);
      // NOTE: 100 <-Quotes- 300 <-Quotes- 301 => 301's original is 300 (not 100)
      expect(quote301.getOriginalNoteID()).toStrictEqual(
        Option.some('300' as NoteID),
      );
    });
  });
});
