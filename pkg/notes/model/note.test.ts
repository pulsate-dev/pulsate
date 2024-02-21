import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { type CreateNoteArgs, Note, type NoteID } from './note.js';

const exampleInput: CreateNoteArgs = {
  id: '1' as ID<NoteID>,
  content: 'hello world!',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  visibility: 'public',
  attachmentFileIDs: ['11938472'],
  cwComment: '',
};

describe('Note', () => {
  it('generate new instance', () => {
    const note = Note.new(exampleInput);

    expect(note.getID()).toBe(exampleInput.id);
    expect(note.getContent()).toBe(exampleInput.content);
    expect(note.getVisibility()).toBe(exampleInput.visibility);
    expect(note.getAttachmentFileIDs()).toBe(exampleInput.attachmentFileIDs);
    expect(note.getCwComment()).toBe(exampleInput.cwComment);
    expect(note.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(note.getUpdatedAt()).toBe(undefined);
    expect(note.getDeletedAt()).toBe(undefined);
  });

  it('note content must be less than 3000', () => {
    expect(() =>
      Note.new({ ...exampleInput, content: 'a'.repeat(3001) }),
    ).toThrow();
  });

  it('note content must not be empty without an attachment', () => {
    expect(() =>
      Note.new({ ...exampleInput, content: '', attachmentFileIDs: [] }),
    ).toThrow();
  });

  it('note attachments must be less than 16', () => {
    expect(() =>
      Note.new({ ...exampleInput, attachmentFileIDs: new Array(17).fill('1') }),
    ).toThrow();
  });

  it("when visibility is direct, sendTo can't be empty", () => {
    expect(() =>
      Note.new({ ...exampleInput, visibility: 'direct', sendTo: undefined }),
    ).toThrow();
  });
});
