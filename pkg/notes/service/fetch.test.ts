import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { FetchNoteService } from './fetch.js';

describe('FetchNoteService', () => {
  const testNote = Note.new({
    id: '1' as ID<NoteID>,
    authorID: '2' as ID<AccountID>,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date(),
    sendTo: Option.none(),
    visibility: 'PUBLIC',
  });
  const repository = new InMemoryNoteRepository([testNote]);
  const service = new FetchNoteService(repository);

  it('should fetch notes', async () => {
    const res = await service.fetchNoteByID('1' as ID<NoteID>);

    expect(Option.isSome(res)).toBe(true);
    expect(res[1]).toStrictEqual(testNote);
  });

  it('note not found', async () => {
    const res = await service.fetchNoteByID('2' as ID<NoteID>);

    expect(Option.isNone(res)).toBe(true);
  });
});
