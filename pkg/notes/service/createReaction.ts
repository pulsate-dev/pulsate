import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import { NoteNotFoundError } from '../model/errors.js';
import type { Note, NoteID } from '../model/note.js';
import { Reaction } from '../model/reaction.js';
import { getReactionRedirectTargetID } from '../model/reactionDomainService.js';
import {
  type NoteRepository,
  noteRepoSymbol,
  type ReactionRepository,
  reactionRepoSymbol,
} from '../model/repository.js';

export class CreateReactionService {
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #reactionRepository: ReactionRepository;
  readonly #noteRepository: NoteRepository;
  constructor(
    idGenerator: SnowflakeIDGenerator,
    reactionRepository: ReactionRepository,
    noteRepository: NoteRepository,
  ) {
    this.#idGenerator = idGenerator;
    this.#reactionRepository = reactionRepository;
    this.#noteRepository = noteRepository;
  }

  async handle(
    noteID: NoteID,
    accountID: AccountID,
    body: string,
  ): Promise<Result.Result<Error, Note>> {
    const notFound = (message: string) => () =>
      new NoteNotFoundError(message, { cause: null });

    return Cat.doT(resultPromiseMonad<Error>())
      .addM(
        'note',
        this.#noteRepository
          .findByID(noteID)
          .then(Option.okOrElse(notFound('Note not found'))),
      )
      .addM('id', Promise.resolve(this.#idGenerator.generate<Reaction>()))
      .addMWith('reaction', ({ id, note }) =>
        Promise.resolve(Reaction.new({ id, note, accountID, body })),
      )
      .runWith(({ reaction }) =>
        this.#reactionRepository.create(reaction).then(Result.map(() => [])),
      )
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
  ({ idGenerator, reactionRepository, noteRepository }) =>
    new CreateReactionService(idGenerator, reactionRepository, noteRepository),
  {
    idGenerator: snowflakeIDGeneratorSymbol,
    reactionRepository: reactionRepoSymbol,
    noteRepository: noteRepoSymbol,
  },
);
