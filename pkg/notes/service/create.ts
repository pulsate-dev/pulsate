import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import { Note, type NoteID, type NoteVisibility } from '../model/note.js';
import type { NoteRepository } from '../model/repository.js';

export class CreateNoteService {
  async handle(
    content: string,
    contentsWarningComment: string,
    sendTo: Option.Option<ID<AccountID>>,
    authorID: ID<AccountID>,
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    const id = this.idGenerator.generate<NoteID>();
    if (Result.isErr(id)) {
      return id;
    }
    try {
      const note = Note.new({
        id: id[1],
        content: content,
        contentsWarningComment: contentsWarningComment,
        createdAt: new Date(),
        sendTo: sendTo,
        originalNoteID: Option.none(),
        visibility: visibility,
        authorID: authorID,
      });
      const res = await this.noteRepository.create(note);
      if (Result.isErr(res)) {
        return res;
      }

      return Result.ok(note);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly idGenerator: SnowflakeIDGenerator,
  ) {}
}
