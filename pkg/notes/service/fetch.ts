import { type Option } from '@mikuroxina/mini-fn';

import type { ID } from '../../id/type.js';
import { type Note, type NoteID } from '../model/note.js';
import type { NoteRepository } from '../model/repository.js';

export class FetchNoteService {
  constructor(private readonly noteRepository: NoteRepository) {}

  async fetchNoteByID(noteID: ID<NoteID>): Promise<Option.Option<Note>> {
    return await this.noteRepository.findByID(noteID);
  }
}
