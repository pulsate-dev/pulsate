import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../model/note.js';
import {
  type NoteRepository,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.js';

export class DeleteReactionService {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const note = await this.noteRepository.findByID(noteID);
    let targetNoteID = noteID;
    if (Option.isSome(note)) {
      const unwrappedNote = Option.unwrap(note);
      if (unwrappedNote.isRenote() && !unwrappedNote.isQuote()) {
        targetNoteID = Option.unwrap(unwrappedNote.getOriginalNoteID());
      }
    }

    const reactionRes = await this.reactionRepository.findByCompositeID({
      noteID: targetNoteID,
      accountID,
    });
    if (Result.isErr(reactionRes)) {
      return reactionRes;
    }

    return await this.reactionRepository.deleteByID(
      Result.unwrap(reactionRes).getID(),
    );
  }
}
export const deleteReactionSymbol =
  Ether.newEtherSymbol<DeleteReactionService>();
export const deleteReaction = Ether.newEther(
  deleteReactionSymbol,
  ({ reactionRepository, noteRepository }) =>
    new DeleteReactionService(reactionRepository, noteRepository),
  {
    reactionRepository: reactionRepoSymbol,
    noteRepository: noteRepoSymbol,
  },
);
