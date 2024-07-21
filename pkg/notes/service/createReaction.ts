import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note, NoteID } from '../model/note.js';
import type {
  NoteRepository,
  ReactionRepository,
} from '../model/repository.js';

export class CreateReactionService {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
    emoji: string,
  ): Promise<Result.Result<Error, Note>> {
    const note = await this.noteRepository.findByID(noteID);
    if (Option.isNone(note)) {
      return Result.err(new Error('Note not found'));
    }

    const existReaction = await this.reactionRepository.findByID({
      noteID,
      accountID,
    });

    if (Option.isSome(existReaction)) {
      return Result.err(new Error('reaction has already created'));
    }

    const creation = await this.reactionRepository.create(
      {
        noteID,
        accountID,
      },
      emoji,
    );

    return Result.map(() => Option.unwrap(note))(creation);
  }
}
