import { type z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import type { NoteVisibility } from '../../model/note.js';
import type { CreateNoteService } from '../../service/create.js';
import { type CreateNoteResponseSchema } from '../validator/schema.js';

export class NoteController {
  constructor(private readonly createNoteService: CreateNoteService) {}

  async createNote(
    authorID: string,
    content: string,
    visibility: string,
    contentsWarningComment: string,
    sendTo?: string,
  ): Promise<Result.Result<Error, z.infer<typeof CreateNoteResponseSchema>>> {
    const res = await this.createNoteService.handle(
      content,
      contentsWarningComment,
      !sendTo ? Option.none() : Option.some(sendTo as ID<AccountID>),
      authorID as ID<AccountID>,
      visibility as NoteVisibility,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      content: res[1].getContent(),
      visibility: res[1].getVisibility(),
      contents_warning_comment: res[1].getCwComment(),
      send_to: Option.isSome(res[1].getSendTo())
        ? Option.unwrap(res[1].getSendTo())
        : undefined,
      author_id: res[1].getAuthorID(),
      created_at: res[1].getCreatedAt().toUTCString(),
    });
  }
}
