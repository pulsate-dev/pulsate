import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import type { NoteID, NoteVisibility } from '../model/note.js';
import { Note } from '../model/note.js';
import type { NoteRepository } from '../model/repository.js';

export class RenoteService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly idGenerator: SnowflakeIDGenerator,
  ) {}

  async handle(
    originalNoteID: ID<NoteID>,
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    if (visibility === 'DIRECT') {
      return Result.err(new Error('Renote must not be direct note'));
    }

    // ToDo: check renote-able
    const originalNote = await this.noteRepository.findByID(originalNoteID);
    if (Option.isNone(originalNote)) {
      return Result.err(new Error('Original note not found'));
    }

    const id = this.idGenerator.generate<NoteID>();
    if (Result.isErr(id)) {
      return id;
    }

    const renote = Note.new({
      id: Result.unwrap(id) as ID<NoteID>,
      authorID: authorID,
      content: content,
      contentsWarningComment: contentsWarningComment,
      createdAt: new Date(),
      originalNoteID: Option.some(originalNoteID),
      sendTo: Option.none(),
      visibility: visibility,
    });

    const res = await this.noteRepository.create(renote);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(renote);
  }
}
