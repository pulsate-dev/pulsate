import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Medium } from '../../drive/model/medium.js';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import type { Note, NoteID } from '../model/note.js';
import type { Reaction } from '../model/reaction.js';
import type { RenoteStatus } from '../model/renoteStatus.js';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.js';

export class FetchService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly accountModule: AccountModuleFacade,
    private readonly noteAttachmentRepository: NoteAttachmentRepository,
    private readonly reactionRepository: ReactionRepository,
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

  async fetchNotesByID(
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    return await this.noteRepository.findManyByIDs(noteIDs);
  }

  async fetchNoteAttachments(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.noteAttachmentRepository.findByNoteID(noteID);
  }

  async fetchNoteReactions(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Reaction[]>> {
    return await this.reactionRepository.findByNoteID(noteID);
  }

  async fetchRenoteStatus(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<RenoteStatus[]> {
    return await this.noteRepository.fetchRenoteStatus(accountID, noteIDs);
  }
}

export const fetchSymbol = Ether.newEtherSymbol<FetchService>();
export const fetch = Ether.newEther(
  fetchSymbol,
  ({
    noteRepository,
    accountModule,
    noteAttachmentRepository,
    reactionRepository,
  }) =>
    new FetchService(
      noteRepository,
      accountModule,
      noteAttachmentRepository,
      reactionRepository,
    ),
  {
    noteRepository: noteRepoSymbol,
    accountModule: accountModuleFacadeSymbol,
    noteAttachmentRepository: noteAttachmentRepoSymbol,
    reactionRepository: reactionRepoSymbol,
  },
);
