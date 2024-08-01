import { Option, Result } from '@mikuroxina/mini-fn';

import type { Medium } from '../../drive/model/medium.js';
import type { AccountModuleFacade } from '../../intermodule/account.js';
import type { Note, NoteID } from '../model/note.js';
import type {
  NoteAttachmentRepository,
  NoteRepository,
} from '../model/repository.js';

export class FetchService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly accountModule: AccountModuleFacade,
    private readonly noteAttachmentRepository: NoteAttachmentRepository,
  ) {}

  async fetchNoteByID(noteID: NoteID): Promise<Option.Option<Note>> {
    const note = await this.noteRepository.findByID(noteID);
    if (Option.isNone(note)) {
      return Option.none();
    }
    // if note deleted
    if (Option.isSome(note[1].getDeletedAt())) {
      return Option.none();
    }
    const account = await this.accountModule.fetchAccount(
      note[1].getAuthorID(),
    );

    if (Result.isErr(account)) {
      return Option.none();
    }

    // if account frozen
    if (account[1].getFrozen() === 'frozen') {
      return Option.none();
    }

    return note;
  }

  async fetchNoteAttachments(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    const attachments =
      await this.noteAttachmentRepository.findByNoteID(noteID);

    if (Result.isErr(attachments)) {
      return attachments;
    }

    return Result.ok(attachments[1]);
  }
}
