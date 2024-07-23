import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountModuleFacade } from '../../intermodule/interfaces/account.js';
import type { Note, NoteID } from '../model/note.js';
import type { NoteRepository } from '../model/repository.js';

export class FetchService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly accountModule: AccountModuleFacade,
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
}
