import { z } from '@hono/zod-openapi';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export const UnicodeEmojiSchema = z
  .string()
  .regex(
    /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/,
  );

export const CustomEmojiSchema = z.string().regex(/<:(\w+):(\d+)>/);

export const EmojiSchema = z.union([UnicodeEmojiSchema, CustomEmojiSchema]);

type Emoji = z.infer<typeof EmojiSchema>;

export interface CreateReactionArgs {
  accountID: AccountID;
  noteID: NoteID;
  body: string;
}

export class Reaction {
  private constructor(arg: CreateReactionArgs) {
    this.accountID = arg.accountID;
    this.noteID = arg.noteID;
    this.emoji = arg.body;
  }

  static new(arg: CreateReactionArgs): Reaction {
    const emoji = EmojiSchema.safeParse(arg.body);
    if (emoji.success) {
      return new Reaction(arg);
    }
    throw new Error('Emoji type is invalid');
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
