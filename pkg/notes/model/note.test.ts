import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import { type CreateNoteArgs, Note, type NoteID } from './note.js';

const exampleInput = {
  id: '1' as NoteID,
  authorID: '2' as AccountID,
  content: 'hello world!',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  visibility: 'PUBLIC',
  contentsWarningComment: '',
  sendTo: Option.none(),
  originalNoteID: Option.none(),
  attachmentFileID: ['10' as MediumID, '20' as MediumID, '30' as MediumID],
} as const satisfies CreateNoteArgs;

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

  describe('content length validation', () => {
    it.each([
      {
        label: 'exactly 3000 chars (boundary)',
        length: 3000,
        shouldErr: false,
      },
      { label: 'exceeds 3000 chars', length: 3001, shouldErr: true },
    ])('$label', ({ length, shouldErr }) => {
      const res = Note.new({ ...exampleInput, content: 'a'.repeat(length) });
      if (shouldErr) {
        expect(Result.isErr(res)).toBe(true);
        expect(Result.unwrapErr(res).message).toBe('Content too long');
      } else {
        expect(Result.isOk(res)).toBe(true);
      }
    });
  });

  describe('contentsWarningComment length validation', () => {
    it.each([
      {
        label: 'exactly 256 chars (boundary)',
        length: 256,
        shouldErr: false,
      },
      { label: 'exceeds 256 chars', length: 257, shouldErr: true },
    ])('$label', ({ length, shouldErr }) => {
      const res = Note.new({
        ...exampleInput,
        contentsWarningComment: 'a'.repeat(length),
      });
      if (shouldErr) {
        expect(Result.isErr(res)).toBe(true);
        expect(Result.unwrapErr(res).message).toBe(
          'ContentsWarningComment too long',
        );
      } else {
        expect(Result.isOk(res)).toBe(true);
      }
    });
  });

  describe('attachmentFileID count validation', () => {
    it.each([
      {
        label: 'exactly 16 attachments (boundary)',
        count: 16,
        shouldErr: false,
      },
      { label: 'exceeds 16 attachments', count: 17, shouldErr: true },
    ])('$label', ({ count, shouldErr }) => {
      const res = Note.new({
        ...exampleInput,
        attachmentFileID: Array.from(
          { length: count },
          (_, i) => (i + 1).toString() as MediumID,
        ),
      });
      if (shouldErr) {
        expect(Result.isErr(res)).toBe(true);
        expect(Result.unwrapErr(res).message).toBe('Too many attachments');
      } else {
        expect(Result.isOk(res)).toBe(true);
      }
    });
  });

  describe('DIRECT visibility sendTo validation', () => {
    it.each([
      {
        label: 'sendTo is present',
        sendTo: Option.some('3' as AccountID),
        shouldErr: false,
      },
      {
        label: 'sendTo is absent',
        sendTo: Option.none(),
        shouldErr: true,
      },
    ])('$label', ({ sendTo, shouldErr }) => {
      const res = Note.new({ ...exampleInput, visibility: 'DIRECT', sendTo });
      if (shouldErr) {
        expect(Result.isErr(res)).toBe(true);
        expect(Result.unwrapErr(res).message).toBe('No destination');
      } else {
        expect(Result.isOk(res)).toBe(true);
      }
    });
  });

  describe('empty content validation', () => {
    const emptyArgs = {
      content: '',
      contentsWarningComment: '',
      attachmentFileID: [] as MediumID[],
    } as const;

    it.each([
      {
        label:
          'throws when a normal note has no content, CW comment, or attachments',
        originalNoteID: Option.none(),
        shouldErr: true,
      },
      {
        label: 'allows empty content when originalNoteID is present (renote)',
        originalNoteID: Option.some('999' as NoteID),
        shouldErr: false,
      },
    ])('$label', ({ originalNoteID, shouldErr }) => {
      const res = Note.new({ ...exampleInput, ...emptyArgs, originalNoteID });
      if (shouldErr) {
        expect(Result.isErr(res)).toBe(true);
        expect(Result.unwrapErr(res).message).toBe('Note must have content');
      } else {
        expect(Result.isOk(res)).toBe(true);
      }
    });

    it.each([
      {
        label: 'allows empty content when renote has a CW comment',
        args: {
          contentsWarningComment: 'CW text',
          attachmentFileID: [] as MediumID[],
        },
      },
      {
        label: 'allows empty content when renote has attachments',
        args: {
          contentsWarningComment: '',
          attachmentFileID: ['10' as MediumID, '11' as MediumID],
        },
      },
    ])('$label', ({ args }) => {
      const renote = Result.unwrap(
        Note.new({
          ...exampleInput,
          content: '',
          ...args,
          originalNoteID: Option.some('999' as NoteID),
        }),
      );
      expect(renote.getContent()).toBe('');
      expect(renote.getOriginalNoteID()).toStrictEqual(
        Option.some('999' as NoteID),
      );
    });
  });

  describe('quote', () => {
    it.each([
      {
        label: 'with content',
        id: '200' as NoteID,
        content: 'quoting this!',
        contentsWarningComment: '',
        attachmentFileID: [] as MediumID[],
        checkContent: (q: Note) => expect(q.getContent()).toBe('quoting this!'),
      },
      {
        label: 'with CW comment only',
        id: '201' as NoteID,
        content: '',
        contentsWarningComment: 'CW text',
        attachmentFileID: [] as MediumID[],
        checkContent: (q: Note) => expect(q.getCwComment()).toBe('CW text'),
      },
      {
        label: 'with attachments only',
        id: '202' as NoteID,
        content: '',
        contentsWarningComment: '',
        attachmentFileID: ['10' as MediumID],
        checkContent: (q: Note) =>
          expect(q.getAttachmentFileID()).toHaveLength(1),
      },
    ])('should create a quote $label', ({
      id,
      content,
      contentsWarningComment,
      attachmentFileID,
      checkContent,
    }) => {
      const quote = Result.unwrap(
        Note.new({
          id,
          authorID: '3' as AccountID,
          content,
          visibility: 'PUBLIC',
          contentsWarningComment,
          sendTo: Option.none(),
          originalNoteID: Option.some('100' as NoteID),
          attachmentFileID,
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      );

      checkContent(quote);
      expect(quote.isRenote()).toBe(true);
      expect(quote.isQuote()).toBe(true);
    });

    it('should refer to original note when quoting a renote', () => {
      /*
       * originalNoteID resolution (renote chain traversal) is handled
       * by the service layer (resolveOriginalNote), not by Note.new().
       * Note.new() simply stores the originalNoteID as given.
       */
      const quote = Result.unwrap(
        Note.new({
          id: '301' as NoteID,
          authorID: '4' as AccountID,
          content: 'quoting a renote',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          originalNoteID: Option.some('100' as NoteID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-12T00:00:00.000Z'),
        }),
      );

      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
    });

    it('should refer to the quote itself when quoting a quote', () => {
      const quote301 = Result.unwrap(
        Note.new({
          id: '301' as NoteID,
          authorID: '4' as AccountID,
          content: 'quoting a quote',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          // 100 <-Quotes- 300 <-Quotes- 301 => 301's original is 300 (not 100)
          originalNoteID: Option.some('300' as NoteID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-12T00:00:00.000Z'),
        }),
      );

      expect(quote301.getOriginalNoteID()).toStrictEqual(
        Option.some('300' as NoteID),
      );
    });
  });
});
