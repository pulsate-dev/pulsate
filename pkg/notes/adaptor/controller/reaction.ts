import type { z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../accounts/model/account.js';
import type { NoteID } from '../../model/note.js';
import type { CreateReactionService } from '../../service/createReaction.js';
import type { FetchService } from '../../service/fetch.js';
import type { CreateReactionResponseSchema } from '../validator/schema.js';

export class ReactionController {
  constructor(
    private readonly createReactionService: CreateReactionService,
    private readonly fetchNoteService: FetchService,
  ) {}

  async create(
    noteID: string,
    accountID: string,
    body: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof CreateReactionResponseSchema>>
  > {
    const reactionRes = await this.createReactionService.handle(
      noteID as NoteID,
      accountID as AccountID,
      body,
    );

    if (Result.isErr(reactionRes)) {
      return reactionRes;
    }

    const note = Result.unwrap(reactionRes);

    const attachmentsRes = await this.fetchNoteService.fetchNoteAttachments(
      note.getID(),
    );

    if (Result.isErr(attachmentsRes)) {
      return attachmentsRes;
    }
    const attachments = Result.unwrap(attachmentsRes);

    return Result.ok({
      id: note.getID(),
      content: note.getContent(),
      visibility: note.getVisibility(),
      contents_warning_comment: note.getCwComment(),
      author_id: note.getAuthorID(),
      attachment_files: attachments.map((v) => ({
        id: v.getId(),
        name: v.getName(),
        mime: v.getMime(),
        url: v.getUrl(),
        hash: v.getHash(),
        author_id: v.getAuthorId(),
        nsfw: v.isNsfw(),
        thumbnail: v.getThumbnailUrl(),
      })),
      created_at: note.getCreatedAt().toUTCString(),
    });
  }
}
