import type { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { MediumID } from '../../../drive/model/medium.ts';
import type { Principal } from '../../../internal/policy/principal.ts';
import type { NoteID, NoteVisibility } from '../../model/note.ts';
import type { CreateService } from '../../service/create.ts';
import type { FetchService } from '../../service/fetch.ts';
import type { ReadNoteService } from '../../service/read.ts';
import type { RenoteService } from '../../service/renote.ts';
import type {
  CreateNoteResponseSchema,
  GetNoteResponseSchema,
  RenoteResponseSchema,
} from '../validator/schema.ts';

export class NoteController {
  readonly #createService: CreateService;
  readonly #fetchService: FetchService;
  readonly #renoteService: RenoteService;
  readonly #readService: ReadNoteService;
  constructor(
    createService: CreateService,
    fetchService: FetchService,
    renoteService: RenoteService,
    readService: ReadNoteService,
  ) {
    this.#createService = createService;
    this.#fetchService = fetchService;
    this.#renoteService = renoteService;
    this.#readService = readService;
  }

  async createNote(args: {
    authorID: string;
    content: string;
    visibility: string;
    contentsWarningComment: string;
    attachmentFileID: string[];
  }): Promise<Result.Result<Error, z.infer<typeof CreateNoteResponseSchema>>> {
    const noteRes = await this.#createService.handle(
      args.content,
      args.contentsWarningComment,
      args.authorID as AccountID,
      args.attachmentFileID as MediumID[],
      args.visibility as NoteVisibility,
    );
    if (Result.isErr(noteRes)) {
      return noteRes;
    }

    const note = Result.unwrap(noteRes);
    const attachmentsRes = await this.#fetchService.fetchNoteAttachments(
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
      created_at: note.getCreatedAt().toUTCString(),
      attachment_files: attachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: Option.unwrapOr('')(v.getUrl()),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: Option.unwrapOr('')(v.getThumbnailUrl()),
        };
      }),
    });
  }

  async getNoteByID(
    noteID: string,
    principal: Principal<AccountID>,
  ): Promise<Result.Result<Error, z.infer<typeof GetNoteResponseSchema>>> {
    const result = await this.#readService.handle(noteID as NoteID, principal);
    if (Result.isErr(result)) return result;
    const { note, author, attachments, reactions, renoted } =
      Result.unwrap(result);

    return Result.ok({
      id: note.getID(),
      content: note.getContent(),
      contents_warning_comment: note.getCwComment(),
      visibility: note.getVisibility(),
      created_at: note.getCreatedAt().toUTCString(),
      attachment_files: attachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: Option.unwrapOr('')(v.getUrl()),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: Option.unwrapOr('')(v.getThumbnailUrl()),
        };
      }),
      reactions: reactions.map((v) => {
        return {
          emoji: v.getEmoji(),
          reacted_by: v.getAccountID(),
        };
      }),
      author: {
        id: author.id,
        name: author.name,
        display_name: author.display_name,
        bio: author.bio,
        avatar: '',
        header: '',
        followed_count: 0,
        following_count: 0,
      },
      renoted,
    });
  }

  async renote(args: {
    originalNoteID: string;
    authorID: string;
    content: string;
    visibility: string;
    contentsWarningComment: string;
    attachmentFileID: string[];
  }): Promise<Result.Result<Error, z.infer<typeof RenoteResponseSchema>>> {
    const renoteRes = await this.#renoteService.handle(
      args.originalNoteID as NoteID,
      args.content,
      args.contentsWarningComment,
      args.authorID as AccountID,
      args.attachmentFileID as MediumID[],
      args.visibility as NoteVisibility,
    );
    if (Result.isErr(renoteRes)) {
      return renoteRes;
    }
    const renote = Result.unwrap(renoteRes);

    const attachmentsRes = await this.#fetchService.fetchNoteAttachments(
      renote.getID(),
    );
    if (Result.isErr(attachmentsRes)) {
      return attachmentsRes;
    }
    const attachments = Result.unwrap(attachmentsRes);

    return Result.ok({
      id: renote.getID(),
      content: renote.getContent(),
      visibility: renote.getVisibility(),
      contents_warning_comment: renote.getCwComment(),
      original_note_id: Option.unwrap(renote.getOriginalNoteID()),
      author_id: renote.getAuthorID(),
      attachment_files: attachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: Option.unwrapOr('')(v.getUrl()),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: Option.unwrapOr('')(v.getThumbnailUrl()),
        };
      }),
      created_at: renote.getCreatedAt().toUTCString(),
    });
  }
}
