import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import { NoteNotFoundError } from '../model/errors.js';
import type { Note, NoteID } from '../model/note.js';
import { Reaction } from '../model/reaction.js';
import {
  type NoteRepository,
  type ReactionRepository,
  noteRepoSymbol,
  reactionRepoSymbol,
} from '../model/repository.js';

export class CreateReactionService {
  constructor(
    private readonly idGenerator: SnowflakeIDGenerator,
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

    const id = this.idGenerator.generate<Reaction>();
    if (Result.isErr(id)) {
      return id;
    }

    const reaction = Reaction.new({
      id: Result.unwrap(id),
      noteID,
      accountID,
      body,
    });

    const res = await this.reactionRepository.create(reaction);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(Option.unwrap(note));
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
