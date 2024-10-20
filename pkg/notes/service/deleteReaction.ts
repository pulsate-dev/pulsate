import type { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../model/note.js';
import type { ReactionRepository } from '../model/repository.js';

export class DeleteReactionService {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return await this.reactionRepository.deleteByID({ noteID, accountID });
  }
}
