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
    Result.Result<
      { code: 400 | 404; error: Error },
      z.infer<typeof CreateReactionResponseSchema>
    >
  > {
    const reactionRes = await this.createReactionService.handle(
      noteID as NoteID,
      accountID as AccountID,
      body,
    );

    if (Result.isErr(reactionRes)) {
      const error = Result.unwrapErr(reactionRes);
      // ToDo: Replace this with custom error class
      switch (error.message) {
        case 'Note not found':
          return Result.err({ code: 404, error });
        case 'already reacted':
          return Result.err({ code: 400, error });
        default:
          return Result.err({ code: 400, error });
      }
    }

    const note = Result.unwrap(reactionRes);

    const attachmentsRes = await this.fetchNoteService.fetchNoteAttachments(
      note.getID(),
    );

    if (Result.isErr(attachmentsRes)) {
      return Result.err({ code: 400, error: Result.unwrapErr(attachmentsRes) });
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
