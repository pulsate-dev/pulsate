import { Option } from '@mikuroxina/mini-fn';
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
    const note = Note.new(exampleInput);

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

  it('note content must be less than 3000', () => {
    expect(() =>
      Note.new({ ...exampleInput, content: 'a'.repeat(3001) }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('contentsWarningComment must be less than 256 chars', () => {
    expect(() =>
      Note.new({ ...exampleInput, contentsWarningComment: 'a'.repeat(257) }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should throw error when attachmentFileID length exceeds 16', () => {
    expect(() =>
      Note.new({
        ...exampleInput,
        attachmentFileID: Array.from(
          { length: 17 },
          (_, i) => (i + 1).toString() as MediumID,
        ),
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  it("when visibility is direct, sendTo can't be empty", () => {
    expect(() =>
      Note.new({
        ...exampleInput,
        visibility: 'DIRECT',
        sendTo: Option.none(),
      }),
    ).toThrow('No destination');
  });

  it('should throw error when normal note (non-renote) has no content, CW comment, and attachments', () => {
    expect(() =>
      Note.new({
        ...exampleInput,
        content: '',
        contentsWarningComment: '',
        attachmentFileID: [],
        originalNoteID: Option.none(),
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should allow empty content for renote (originalNoteID is Some)', () => {
    const renote = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: '',
      attachmentFileID: [],
      originalNoteID: Option.some('999' as NoteID),
    });

    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(0);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with CW comment', () => {
    const renote = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: 'CW text',
      attachmentFileID: [],
      originalNoteID: Option.some('999' as NoteID),
    });

    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('CW text');
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with attachments', () => {
    const renote = Note.new({
      ...exampleInput,
      content: '',
      contentsWarningComment: '',
      attachmentFileID: ['10' as MediumID, '11' as MediumID],
      originalNoteID: Option.some('999' as NoteID),
    });

    expect(renote.getContent()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(2);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  describe('quote', () => {
    it('should create a quote with content', () => {
      const quote = Note.new({
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

      expect(quote.getContent()).toBe('quoting this!');
      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
      expect(quote.isRenote()).toBe(true);
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with CW comment only', () => {
      const quote = Note.new({
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

      expect(quote.getContent()).toBe('');
      expect(quote.getCwComment()).toBe('CW text');
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with attachments only', () => {
      const quote = Note.new({
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
      const quote = Note.new({
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

      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
    });

    it('should refer to the quote itself when quoting a quote', () => {
      const quote301 = Note.new({
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

      // NOTE: 100 <-Quotes- 300 <-Quotes- 301 => 301's original is 300 (not 100)
      expect(quote301.getOriginalNoteID()).toStrictEqual(
        Option.some('300' as NoteID),
      );
    });
  });
});
