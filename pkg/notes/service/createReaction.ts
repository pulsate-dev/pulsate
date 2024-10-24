import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { NoteNotFoundError } from '../model/errors.js';
import type { Note, NoteID } from '../model/note.js';
import {
  type NoteRepository,
  type ReactionRepository,
  noteRepoSymbol,
  reactionRepoSymbol,
} from '../model/repository.js';

export class CreateReactionService {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
    body: string,
  ): Promise<Result.Result<Error, Note>> {
    const note = await this.noteRepository.findByID(noteID);
    if (Option.isNone(note)) {
      return Result.err(
        new NoteNotFoundError('Note not found', { cause: null }),
      );
    }

    const reaction = await this.reactionRepository.create(
      { noteID, accountID },
      body,
    );

    return Result.map(() => Option.unwrap(note))(reaction);
  }
}
export const createReactionServiceSymbol =
  Ether.newEtherSymbol<CreateReactionService>();
export const createReactionService = Ether.newEther(
  createReactionServiceSymbol,
  ({ reactionRepository, noteRepository }) =>
    new CreateReactionService(reactionRepository, noteRepository),
  {
    reactionRepository: reactionRepoSymbol,
    noteRepository: noteRepoSymbol,
  },
);
