import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { NoteInvalidReactionError } from './errors.js';
import type { NoteID } from './note.js';

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
  noteID: NoteID;
  body: string;
}

export class Reaction {
  readonly #id: ReactionID;
  readonly #accountID: AccountID;
  readonly #noteID: NoteID;
  readonly #emoji: Emoji;

  private constructor(args: CreateReactionArgs) {
    this.#id = args.id;
    this.#accountID = args.accountID;
    this.#noteID = args.noteID;
    this.#emoji = args.body as Emoji;
  }

  static new(
    arg: CreateReactionArgs,
  ): Result.Result<NoteInvalidReactionError, Reaction> {
    if (!v.safeParse(EmojiSchema, arg.body).success) {
      return Result.err(
        new NoteInvalidReactionError('Emoji type is invalid', { cause: null }),
      );
    }
    return Result.ok(new Reaction(arg));
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
