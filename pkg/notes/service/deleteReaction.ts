import { Ether, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../model/note.js';
import {
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.js';

export class DeleteReactionService {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return await this.reactionRepository.deleteByID({ noteID, accountID });
  }
}
export const deleteReactionSymbol =
  Ether.newEtherSymbol<DeleteReactionService>();
export const deleteReaction = Ether.newEther(
  deleteReactionSymbol,
  ({ reactionRepository }) => new DeleteReactionService(reactionRepository),
  {
    reactionRepository: reactionRepoSymbol,
  },
);
