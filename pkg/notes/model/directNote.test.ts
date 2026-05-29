import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  type CreateDirectNoteArgs,
  DirectNote,
  type DirectNoteID,
} from './directNote.js';
import {
  DirectNoteContentLengthError,
  DirectNoteTooManyAttachmentsError,
} from './errors.js';

const exampleInput: Omit<CreateDirectNoteArgs, 'deletedAt'> = {
  id: '1' as DirectNoteID,
  authorID: '2' as AccountID,
  recipientID: '3' as AccountID,
  content: 'hello world!',
  contentsWarningComment: '',
  attachmentFileID: [],
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
};

describe('DirectNote', () => {
  it('generate new instance', () => {
    const note = Result.unwrap(DirectNote.new(exampleInput));

    expect(note.getID()).toBe(exampleInput.id);
    expect(note.getAuthorID()).toBe(exampleInput.authorID);
    expect(note.getRecipientID()).toBe(exampleInput.recipientID);
    expect(note.getContent()).toBe(exampleInput.content);
    expect(note.getCwComment()).toBe(exampleInput.contentsWarningComment);
    expect(note.getAttachmentFileID()).toStrictEqual([]);
    expect(note.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(note.getDeletedAt()).toStrictEqual(Option.none());
  });

  it.each([
    {
      name: 'with attachments',
      args: { attachmentFileID: ['10' as MediumID, '20' as MediumID] },
      expected: { content: exampleInput.content, attachmentCount: 2 },
    },
    {
      name: 'with only attachments (no text)',
      args: { content: '', attachmentFileID: ['10' as MediumID] },
      expected: { content: '', attachmentCount: 1 },
    },
    {
      name: 'with only CW comment',
      args: { content: '', contentsWarningComment: 'CW text' },
      expected: { content: '', attachmentCount: 0 },
    },
  ])('generate instance $name', ({ args, expected }) => {
    const note = Result.unwrap(DirectNote.new({ ...exampleInput, ...args }));

    expect(note.getContent()).toBe(expected.content);
    expect(note.getAttachmentFileID()).toHaveLength(expected.attachmentCount);
  });

  describe('invalid input', () => {
    it.each([
      {
        name: 'content too long',
        args: { ...exampleInput, content: 'a'.repeat(3001) },
        expectedError: DirectNoteContentLengthError,
      },
      {
        name: 'contentsWarningComment too long',
        args: { ...exampleInput, contentsWarningComment: 'a'.repeat(257) },
        expectedError: DirectNoteContentLengthError,
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
        expectedError: DirectNoteTooManyAttachmentsError,
      },
      {
        name: 'empty content, no CW comment, and no attachments',
        args: {
          ...exampleInput,
          content: '',
          contentsWarningComment: '',
          attachmentFileID: [],
        },
        expectedError: DirectNoteContentLengthError,
      },
    ])('$name returns error', ({ args, expectedError }) => {
      const result = DirectNote.new(args);
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(expectedError);
    });
  });

  describe('setDeletedAt', () => {
    it('sets deletedAt when date is after createdAt', () => {
      const note = Result.unwrap(DirectNote.new(exampleInput));
      const deletedAt = new Date('2023-09-11T00:00:00.000Z');

      const result = note.setDeletedAt(deletedAt);
      expect(Result.isOk(result)).toBe(true);
      expect(note.getDeletedAt()).toStrictEqual(Option.some(deletedAt));
    });

    it('returns error when deletedAt is before createdAt', () => {
      const note = Result.unwrap(DirectNote.new(exampleInput));
      const deletedAt = new Date('2023-09-09T00:00:00.000Z');

      const result = note.setDeletedAt(deletedAt);
      expect(Result.isErr(result)).toBe(true);
    });
  });

  it('reconstruct from stored data', () => {
    const deletedAt = new Date('2023-09-11T00:00:00.000Z');
    const note = DirectNote.reconstruct({
      ...exampleInput,
      deletedAt: Option.some(deletedAt),
    });

    expect(note.getID()).toBe(exampleInput.id);
    expect(note.getDeletedAt()).toStrictEqual(Option.some(deletedAt));
  });
});
