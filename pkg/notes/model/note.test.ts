import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { type CreateNoteArgs, Note, type NoteID } from './note.js';

const exampleInput: CreateNoteArgs = {
  id: '1' as ID<NoteID>,
  content: 'hello world!',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  visibility: 'PUBLIC',
  contentsWarningComment: '',
  sendTo: Option.none(),
  updatedAt: Option.none(),
  deletedAt: Option.none(),
};

describe('Note', () => {
  it('generate new instance', () => {
    const note = Note.new(exampleInput);

    expect(note.getID()).toBe(exampleInput.id);
    expect(note.getContent()).toBe(exampleInput.content);
    expect(note.getVisibility()).toBe(exampleInput.visibility);
    expect(note.getCwComment()).toBe(exampleInput.contentsWarningComment);
    expect(note.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(note.getUpdatedAt()).toStrictEqual(Option.none());
    expect(note.getDeletedAt()).toStrictEqual(Option.none());
  });

  it('note content must be less than 3000', () => {
    expect(() =>
      Note.new({ ...exampleInput, content: 'a'.repeat(3001) }),
    ).toThrow('Too long content');
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
});
