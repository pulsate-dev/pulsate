import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { Medium } from '../../drive/model/medium.ts';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.ts';
import type { Note, NoteID } from '../model/note.ts';
import type { Reaction } from '../model/reaction.ts';
import type { RenoteStatus } from '../model/renoteStatus.ts';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.ts';

export class FetchService {
  readonly #noteRepository: NoteRepository;
  readonly #accountModule: AccountModuleFacade;
  readonly #noteAttachmentRepository: NoteAttachmentRepository;
  readonly #reactionRepository: ReactionRepository;
  constructor(
    noteRepository: NoteRepository,
    accountModule: AccountModuleFacade,
    noteAttachmentRepository: NoteAttachmentRepository,
    reactionRepository: ReactionRepository,
  ) {
    this.#noteRepository = noteRepository;
    this.#accountModule = accountModule;
    this.#noteAttachmentRepository = noteAttachmentRepository;
    this.#reactionRepository = reactionRepository;
  }

  async fetchNoteByID(noteID: NoteID): Promise<Option.Option<Note>> {
    return Cat.doT(Promise.monadT(Option.traversableMonad))
      .addM(
        'note',
        this.#noteRepository
          .findByID(noteID)
          .then(
            Option.andThen((note) =>
              Option.mapOr<Option.Option<Note>>(Option.some(note))(() =>
                Option.none(),
              )(note.getDeletedAt()),
            ),
          ),
      )
      .addMWith('account', ({ note }) =>
        this.#accountModule
          .fetchAccount(note.getAuthorID())
          .then(Result.optionOk),
      )
      .when(
        ({ account }) => account.isFrozen(),
        () => Promise.resolve(Option.none()),
      )
      .finish(({ note }) => note);
  }

  async fetchNotesByID(
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    return await this.#noteRepository.findManyByIDs(noteIDs);
  }

  async fetchNoteAttachments(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.#noteAttachmentRepository.findByNoteID(noteID);
  }

  async fetchNoteReactions(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Reaction[]>> {
    return await this.#reactionRepository.findByNoteID(noteID);
  }

  async fetchRenoteStatus(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<RenoteStatus[]> {
    return await this.#noteRepository.fetchRenoteStatus(accountID, noteIDs);
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
