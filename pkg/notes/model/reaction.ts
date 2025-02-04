import { z } from '@hono/zod-openapi';
import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { NoteID } from './note.js';

export const UnicodeEmojiSchema = z
  .string()
  .regex(
    /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/,
  );

export const CustomEmojiSchema = z.string().regex(/<:(\w+):(\d+)>/);

export const EmojiSchema = z.union([UnicodeEmojiSchema, CustomEmojiSchema]);

type Emoji = z.infer<typeof EmojiSchema>;

export type ReactionID = ID<Reaction>;

export interface CreateReactionArgs {
  id: ReactionID;
  accountID: AccountID;
  noteID: NoteID;
  body: string;
}

export class Reaction {
  private constructor(args: CreateReactionArgs) {
    this.id = args.id;
    this.accountID = args.accountID;
    this.noteID = args.noteID;
    this.emoji = args.body;
  }

  static new(arg: CreateReactionArgs): Reaction {
    const emoji = EmojiSchema.safeParse(arg.body);
    if (emoji.success) {
      return new Reaction(arg);
    }
    throw new Error('Emoji type is invalid');
  }

  private readonly id: ReactionID;
  getID(): ReactionID {
    return this.id;
  }

  private readonly accountID: AccountID;
  getAccountID(): AccountID {
    return this.accountID;
  }

  private readonly noteID: NoteID;
  getNoteID(): NoteID {
    return this.noteID;
  }

  private readonly emoji: Emoji;
  getEmoji(): Emoji {
    return this.emoji;
  }
}
