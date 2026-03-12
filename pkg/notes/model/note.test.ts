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
    const originalNote = Note.new({
      ...exampleInput,
      id: '100' as NoteID,
      visibility: 'PUBLIC',
    });

    it('should create a quote with content', () => {
      const quote = Note.quote(originalNote, {
        id: '200' as NoteID,
        authorID: '3' as AccountID,
        content: 'quoting this!',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
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
      const quote = Note.quote(originalNote, {
        id: '201' as NoteID,
        authorID: '3' as AccountID,
        content: '',
        visibility: 'PUBLIC',
        contentsWarningComment: 'CW text',
        sendTo: Option.none(),
        attachmentFileID: [],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });

      expect(quote.getContent()).toBe('');
      expect(quote.getCwComment()).toBe('CW text');
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with attachments only', () => {
      const quote = Note.quote(originalNote, {
        id: '202' as NoteID,
        authorID: '3' as AccountID,
        content: '',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        attachmentFileID: ['10' as MediumID],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });

      expect(quote.getContent()).toBe('');
      expect(quote.getAttachmentFileID()).toHaveLength(1);
      expect(quote.isQuote()).toBe(true);
    });

    it('should throw error when visibility is DIRECT', () => {
      expect(() =>
        Note.quote(originalNote, {
          id: '203' as NoteID,
          authorID: '3' as AccountID,
          content: 'quoting',
          visibility: 'DIRECT',
          contentsWarningComment: '',
          sendTo: Option.some('4' as AccountID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      ).toThrow('Quote can not be created with DIRECT visibility');
    });

    it('should throw error when content, CW comment, and attachments are all empty', () => {
      expect(() =>
        Note.quote(originalNote, {
          id: '204' as NoteID,
          authorID: '3' as AccountID,
          content: '',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      ).toThrow('Quote must have content');
    });

    it('should throw error when quoting HOME note with PUBLIC visibility', () => {
      const homeNote = Note.new({
        ...exampleInput,
        id: '101' as NoteID,
        visibility: 'HOME',
      });

      expect(() =>
        Note.quote(homeNote, {
          id: '205' as NoteID,
          authorID: '3' as AccountID,
          content: 'quoting',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      ).toThrow('Visibility too open');
    });

    it('should throw error when quoting FOLLOWERS note', () => {
      const followersNote = Note.new({
        ...exampleInput,
        id: '102' as NoteID,
        visibility: 'FOLLOWERS',
      });

      expect(() =>
        Note.quote(followersNote, {
          id: '206' as NoteID,
          authorID: '3' as AccountID,
          content: 'quoting',
          visibility: 'FOLLOWERS',
          contentsWarningComment: '',
          sendTo: Option.none(),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      ).toThrow('This note is not quotable');
    });

    it('should refer to original note when quoting a renote', () => {
      /**
       * NOTE:
       * when   100 <-Renotes- 300 <-Quotes- 301,
       * actual 100 <-Quotes-- 301
       *
       * when   100 <-Quotes- 300  <-Quotes- 301,
       * actual 300 <-Quotes- 301
       */
      const renote = Note.renote(originalNote, {
        id: '300' as NoteID,
        authorID: '3' as AccountID,
        visibility: 'PUBLIC',
        sendTo: Option.none(),
        attachmentFileID: [],
        createdAt: new Date('2023-09-11T00:00:00.000Z'),
      });

      const quote = Note.quote(renote, {
        id: '301' as NoteID,
        authorID: '4' as AccountID,
        content: 'quoting a renote',
        visibility: 'PUBLIC',
        contentsWarningComment: '',
        sendTo: Option.none(),
        attachmentFileID: [],
        createdAt: new Date('2023-09-12T00:00:00.000Z'),
      });

      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
    });
  });
});
