import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import {
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { Note, NoteID } from '../model/note.ts';
import { Reaction } from '../model/reaction.ts';
import { getReactionRedirectTargetID } from '../model/reactionDomainService.ts';
import {
  type NoteRepository,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.ts';

export class CreateReactionService {
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #reactionRepository: ReactionRepository;
  readonly #noteRepository: NoteRepository;
  readonly #eventPublisher: EventPublisher;
  constructor(
    idGenerator: SnowflakeIDGenerator,
    reactionRepository: ReactionRepository,
    noteRepository: NoteRepository,
    eventPublisher: EventPublisher,
  ) {
    this.#idGenerator = idGenerator;
    this.#reactionRepository = reactionRepository;
    this.#noteRepository = noteRepository;
    this.#eventPublisher = eventPublisher;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
    body: string,
  ): Promise<Result.Result<Error, Note>> {
    const notFound = (message: string) => () =>
      new NoteNotFoundError(message, { cause: null });

    return Cat.doT(Promise.resultMonad<Error>())
      .addM(
        'note',
        this.#noteRepository
          .findByID(noteID)
          .then(Option.okOrElse(notFound('Note not found'))),
      )
      .addM('id', Promise.resolve(this.#idGenerator.generate<Reaction>()))
      .addMWith('reaction', ({ id, note }) =>
        Promise.resolve(Reaction.new({ id, note, accountID, body }, accountID)),
      )
      .runWith(({ reaction }) =>
        this.#reactionRepository.create(reaction).then(Result.map(() => [])),
      )
      .runWith(({ reaction }) => {
        this.#eventPublisher.publishMany(reaction.pullEvents());
        return Promise.resolve(Result.ok([]));
      })
      .addMWith('result', async ({ note }) => {
        const redirectTo = getReactionRedirectTargetID(note);
        if (Option.isNone(redirectTo)) {
          return Result.ok(note);
        }
        return this.#noteRepository
          .findByID(Option.unwrap(redirectTo))
          .then(Option.okOrElse(notFound('Original note not found')));
      })
      .finish(({ result }) => result);
  }
}
export const createReactionServiceSymbol =
  Ether.newEtherSymbol<CreateReactionService>();
export const createReactionService = Ether.newEther(
  createReactionServiceSymbol,
  ({ idGenerator, reactionRepository, noteRepository, eventPublisher }) =>
    new CreateReactionService(
      idGenerator,
      reactionRepository,
      noteRepository,
      eventPublisher,
    ),
  {
    idGenerator: snowflakeIDGeneratorSymbol,
    reactionRepository: reactionRepoSymbol,
    noteRepository: noteRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
