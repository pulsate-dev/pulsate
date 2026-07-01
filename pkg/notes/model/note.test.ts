import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  NoteContentLengthError,
  NoteNoDestinationError,
  NoteTooManyAttachmentsError,
} from './errors.js';
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

  describe('invalid input', () => {
    it.each([
      {
        name: 'content too long',
        args: { ...exampleInput, content: 'a'.repeat(3001) },
        expectedError: NoteContentLengthError,
      },
      {
        name: 'contentsWarningComment too long',
        args: {
          ...exampleInput,
          contentsWarningComment: 'a'.repeat(257),
        },
        expectedError: NoteContentLengthError,
      },
      {
        name: 'too many attachments',
        args: {
          ...exampleInput,
          attachmentFileID: Array.from(
            { length: 17 },
            (_, i) => (i + 1).toString() as MediumID,
          ),
        },
        expectedError: NoteTooManyAttachmentsError,
      },
      {
        name: 'direct note without sendTo',
        args: {
          ...exampleInput,
          visibility: 'DIRECT' as const,
          sendTo: Option.none(),
        },
        expectedError: NoteNoDestinationError,
      },
      {
        name: 'normal note with no content, no CW comment, no attachments',
        args: {
          ...exampleInput,
          content: '',
          contentsWarningComment: '',
          attachmentFileID: [],
          originalNoteID: Option.none(),
        },
        expectedError: NoteContentLengthError,
      },
    ])('$name returns error', ({ args, expectedError }) => {
      const result = Note.new(args);
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(expectedError);
    });
  });

  it('should allow empty content for renote (originalNoteID is Some)', () => {
    const renote = Result.unwrap(
      Note.new({
        ...exampleInput,
        content: '',
        contentsWarningComment: '',
        attachmentFileID: [],
        originalNoteID: Option.some('999' as NoteID),
      }),
    );

    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(0);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with CW comment', () => {
    const renote = Result.unwrap(
      Note.new({
        ...exampleInput,
        content: '',
        contentsWarningComment: 'CW text',
        attachmentFileID: [],
        originalNoteID: Option.some('999' as NoteID),
      }),
    );

    expect(renote.getContent()).toBe('');
    expect(renote.getCwComment()).toBe('CW text');
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  it('should allow empty content in renote with attachments', () => {
    const renote = Result.unwrap(
      Note.new({
        ...exampleInput,
        content: '',
        contentsWarningComment: '',
        attachmentFileID: ['10' as MediumID, '11' as MediumID],
        originalNoteID: Option.some('999' as NoteID),
      }),
    );

    expect(renote.getContent()).toBe('');
    expect(renote.getAttachmentFileID()).toHaveLength(2);
    expect(renote.getOriginalNoteID()).toStrictEqual(
      Option.some('999' as NoteID),
    );
  });

  describe('quote', () => {
    it('should create a quote with content', () => {
      const quote = Result.unwrap(
        Note.new({
          id: '200' as NoteID,
          authorID: '3' as AccountID,
          content: 'quoting this!',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          originalNoteID: Option.some('100' as NoteID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      );

      expect(quote.getContent()).toBe('quoting this!');
      expect(quote.getOriginalNoteID()).toStrictEqual(
        Option.some('100' as NoteID),
      );
      expect(quote.isRenote()).toBe(true);
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with CW comment only', () => {
      const quote = Result.unwrap(
        Note.new({
          id: '201' as NoteID,
          authorID: '3' as AccountID,
          content: '',
          visibility: 'PUBLIC',
          contentsWarningComment: 'CW text',
          sendTo: Option.none(),
          originalNoteID: Option.some('100' as NoteID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      );

      expect(quote.getContent()).toBe('');
      expect(quote.getCwComment()).toBe('CW text');
      expect(quote.isQuote()).toBe(true);
    });

    it('should create a quote with attachments only', () => {
      const quote = Result.unwrap(
        Note.new({
          id: '202' as NoteID,
          authorID: '3' as AccountID,
          content: '',
          visibility: 'PUBLIC',
          contentsWarningComment: '',
          sendTo: Option.none(),
          originalNoteID: Option.some('100' as NoteID),
          attachmentFileID: ['10' as MediumID],
          createdAt: new Date('2023-09-11T00:00:00.000Z'),
        }),
      );

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
          originalNoteID: Option.some('300' as NoteID),
          attachmentFileID: [],
          createdAt: new Date('2023-09-12T00:00:00.000Z'),
        }),
      );

      // NOTE: 100 <-Quotes- 300 <-Quotes- 301 => 301's original is 300 (not 100)
      expect(quote301.getOriginalNoteID()).toStrictEqual(
        Option.some('300' as NoteID),
      );
    });

    it.each([
      'FOLLOWERS',
      'DIRECT',
    ] as const)('renote/quote visibility must be PUBLIC or HOME (rejects %s)', (visibility) => {
      const res = Note.new({
        ...exampleInput,
        visibility,
        sendTo:
          visibility === 'DIRECT'
            ? Option.some('999' as AccountID)
            : Option.none(),
        originalNoteID: Option.some('100' as NoteID),
      });

      expect(Result.isErr(res)).toBe(true);
    });
  });

  describe('canBeRenotedBy', () => {
    const author = '2' as AccountID;

    it.each([
      'PUBLIC',
      'HOME',
    ] as const)('%s note can be renoted by anyone', (visibility) => {
      const note = Result.unwrap(Note.new({ ...exampleInput, visibility }));
      expect(Result.isOk(note.canBeRenotedBy('999' as AccountID))).toBe(true);
    });

    it('FOLLOWERS note can be renoted by its author', () => {
      const note = Result.unwrap(
        Note.new({
          ...exampleInput,
          authorID: author,
          visibility: 'FOLLOWERS',
        }),
      );
      expect(Result.isOk(note.canBeRenotedBy(author))).toBe(true);
    });

    it('FOLLOWERS note cannot be renoted by others', () => {
      const note = Result.unwrap(
        Note.new({
          ...exampleInput,
          authorID: author,
          visibility: 'FOLLOWERS',
        }),
      );
      expect(Result.isErr(note.canBeRenotedBy('999' as AccountID))).toBe(true);
    });

    it('DIRECT note cannot be renoted', () => {
      const note = Result.unwrap(
        Note.new({
          ...exampleInput,
          authorID: author,
          visibility: 'DIRECT',
          sendTo: Option.some('999' as AccountID),
        }),
      );
      expect(Result.isErr(note.canBeRenotedBy(author))).toBe(true);
    });
  });

  describe('getReactionTargetNoteID', () => {
    it('returns its own ID for an ordinary note', () => {
      const note = Result.unwrap(Note.new(exampleInput));
      expect(note.getReactionTargetNoteID()).toBe(note.getID());
    });

    it('returns the original note ID for a pure renote', () => {
      const note = Result.unwrap(
        Note.new({
          ...exampleInput,
          content: '',
          contentsWarningComment: '',
          attachmentFileID: [],
          originalNoteID: Option.some('999' as NoteID),
        }),
      );
      expect(note.getReactionTargetNoteID()).toBe('999' as NoteID);
    });

    it('returns its own ID for a quote', () => {
      const note = Result.unwrap(
        Note.new({
          ...exampleInput,
          content: 'quoting!',
          originalNoteID: Option.some('999' as NoteID),
        }),
      );
      expect(note.getReactionTargetNoteID()).toBe(note.getID());
    });
  });
});
