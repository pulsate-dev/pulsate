import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
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
  readonly #eventPublisher: EventPublisher;
  constructor(
    reactionRepository: ReactionRepository,
    noteRepository: NoteRepository,
    eventPublisher: EventPublisher,
  ) {
    this.#reactionRepository = reactionRepository;
    this.#noteRepository = noteRepository;
    this.#eventPublisher = eventPublisher;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    return Cat.doT(Promise.resultMonad<Error>())
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
      .runWith(({ reaction }) =>
        this.#reactionRepository
          .deleteByID(reaction.getID())
          .then(Result.map(() => [])),
      )
      .runWith(async ({ reaction }) => {
        reaction.deleted(accountID);
        await this.#eventPublisher.publishMany(reaction.pullEvents());
        return Promise.resolve(Result.ok([]));
      })
      .finish(() => undefined);
  }
}
export const deleteReactionSymbol =
  Ether.newEtherSymbol<DeleteReactionService>();
export const deleteReaction = Ether.newEther(
  deleteReactionSymbol,
  ({ reactionRepository, noteRepository, eventPublisher }) =>
    new DeleteReactionService(
      reactionRepository,
      noteRepository,
      eventPublisher,
    ),
  {
    reactionRepository: reactionRepoSymbol,
    noteRepository: noteRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
