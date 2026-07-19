import { Cat, Ether, Option, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import { NoteNotFoundError } from '../model/errors.js';
import type { NoteID } from '../model/note.js';
import {
  type NoteRepository,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.js';

export class DeleteReactionService {
  readonly #reactionRepository: ReactionRepository;
  readonly #noteRepository: NoteRepository;
  constructor(
    reactionRepository: ReactionRepository,
    noteRepository: NoteRepository,
  ) {
    this.#reactionRepository = reactionRepository;
    this.#noteRepository = noteRepository;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return Cat.doT(resultPromiseMonad<Error>())
      .addM(
        'note',
        this.#noteRepository
          .findByID(noteID)
          .then(
            Option.okOrElse(
              () => new NoteNotFoundError('Note not found', { cause: null }),
            ),
          ),
      )
      .addMWith('reaction', ({ note }) =>
        this.#reactionRepository.findByCompositeID({
          noteID: note.getReactionTargetNoteID(),
          accountID,
        }),
      )
      .finishM(({ reaction }) =>
        this.#reactionRepository.deleteByID(reaction.getID()),
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
