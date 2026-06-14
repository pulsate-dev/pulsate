import { Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../internal/id/type.js';
import { NoteInvalidReactionError } from './errors.js';
import type { Note, NoteID } from './note.js';

const unicodeEmojiSchema = v.pipe(
  v.string(),
  v.regex(
    /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/,
  ),
);

const customEmojiSchema = v.pipe(v.string(), v.regex(/<:(\w+):(\d+)>/));

export const EmojiSchema = v.union([unicodeEmojiSchema, customEmojiSchema]);

type Emoji = v.InferOutput<typeof EmojiSchema>;

export type ReactionID = ID<Reaction>;

export interface CreateReactionArgs {
  id: ReactionID;
  accountID: AccountID;
  note: Note;
  body: string;
}

export class Reaction {
  readonly #id: ReactionID;
  readonly #accountID: AccountID;
  readonly #noteID: NoteID;
  readonly #emoji: Emoji;

  private constructor(args: {
    id: ReactionID;
    accountID: AccountID;
    noteID: NoteID;
    emoji: Emoji;
  }) {
    this.#id = args.id;
    this.#accountID = args.accountID;
    this.#noteID = args.noteID;
    this.#emoji = args.emoji;
  }

  static new(
    arg: CreateReactionArgs,
  ): Result.Result<NoteInvalidReactionError, Reaction> {
    if (!v.safeParse(EmojiSchema, arg.body).success) {
      return Result.err(
        new NoteInvalidReactionError('Emoji type is invalid', { cause: null }),
      );
    }

    // Reactions on a non-quote renote are attributed to the original note
    const noteID =
      arg.note.isRenote() && !arg.note.isQuote()
        ? Option.unwrap(arg.note.getOriginalNoteID())
        : arg.note.getID();

    return Result.ok(
      new Reaction({
        id: arg.id,
        accountID: arg.accountID,
        noteID,
        emoji: arg.body as Emoji,
      }),
    );
  }

  static reconstruct(arg: {
    id: ReactionID;
    accountID: AccountID;
    noteID: NoteID;
    body: string;
  }): Reaction {
    return new Reaction({
      id: arg.id,
      accountID: arg.accountID,
      noteID: arg.noteID,
      emoji: arg.body as Emoji,
    });
  }

  getID(): ReactionID {
    return this.#id;
  }

  getAccountID(): AccountID {
    return this.#accountID;
  }

  getNoteID(): NoteID {
    return this.#noteID;
  }

  getEmoji(): Emoji {
    return this.#emoji;
  }
}
