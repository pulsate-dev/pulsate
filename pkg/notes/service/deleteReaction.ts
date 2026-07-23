import { Cat, Ether, Option, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { NoteID } from '../model/note.ts';
import {
  type NoteRepository,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.ts';

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
