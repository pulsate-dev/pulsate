import type { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { MediumID } from '../../../drive/model/medium.js';
import type { AccountModuleFacade } from '../../../intermodule/account.js';
import type { NoteID, NoteVisibility } from '../../model/note.js';
import type { CreateService } from '../../service/create.js';
import type { FetchService } from '../../service/fetch.js';
import type { RenoteService } from '../../service/renote.js';
import type {
  CreateNoteResponseSchema,
  GetNoteResponseSchema,
  RenoteResponseSchema,
} from '../validator/schema.js';

export class NoteController {
  constructor(
    private readonly createService: CreateService,
    private readonly fetchService: FetchService,
    private readonly renoteService: RenoteService,
    private readonly accountModule: AccountModuleFacade,
  ) {}

  async createNote(args: {
    authorID: string;
    content: string;
    visibility: string;
    contentsWarningComment: string;
    attachmentFileID: string[];
    sendTo?: string;
  }): Promise<Result.Result<Error, z.infer<typeof CreateNoteResponseSchema>>> {
    const res = await this.createService.handle(
      args.content,
      args.contentsWarningComment,
      !args.sendTo ? Option.none() : Option.some(args.sendTo as AccountID),
      args.authorID as AccountID,
      args.attachmentFileID as MediumID[],
      args.visibility as NoteVisibility,
    );
    if (Result.isErr(res)) {
      return res;
    }

    const unwrapped = Result.unwrap(res);
    const attachments = await this.fetchService.fetchNoteAttachments(
      unwrapped.getID(),
    );
    if (Result.isErr(attachments)) {
      return attachments;
    }
    const unwrappedAttachments = Result.unwrap(attachments);

    return Result.ok({
      id: unwrapped.getID(),
      content: unwrapped.getContent(),
      visibility: unwrapped.getVisibility(),
      contents_warning_comment: unwrapped.getCwComment(),
      send_to: Option.isSome(unwrapped.getSendTo())
        ? Option.unwrap(unwrapped.getSendTo())
        : undefined,
      author_id: unwrapped.getAuthorID(),
      created_at: unwrapped.getCreatedAt().toUTCString(),
      attachment_files: unwrappedAttachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: v.getUrl(),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: v.getThumbnailUrl(),
        };
      }),
    });
  }

  async getNoteByID(
    noteID: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetNoteResponseSchema>>> {
    const res = await this.fetchService.fetchNoteByID(noteID as NoteID);
    if (Option.isNone(res)) {
      return Result.err(new Error('Note not found'));
    }
    const unwrapped = Option.unwrap(res);

    const authorAccount = await this.accountModule.fetchAccount(
      unwrapped.getAuthorID(),
    );
    if (Result.isErr(authorAccount)) {
      return authorAccount;
    }
    const unwrappedAuthor = Result.unwrap(authorAccount);

    const attachments = await this.fetchService.fetchNoteAttachments(
      unwrapped.getID(),
    );
    if (Result.isErr(attachments)) {
      return attachments;
    }
    const unwrappedAttachments = Result.unwrap(attachments);

    return Result.ok({
      id: unwrapped.getID(),
      content: unwrapped.getContent(),
      contents_warning_comment: unwrapped.getCwComment(),
      send_to: Option.isSome(unwrapped.getSendTo())
        ? Option.unwrap(unwrapped.getSendTo())
        : undefined,
      visibility: unwrapped.getVisibility(),
      created_at: unwrapped.getCreatedAt().toUTCString(),
      attachment_files: unwrappedAttachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: v.getUrl(),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: v.getThumbnailUrl(),
        };
      }),
      author: {
        id: unwrappedAuthor.getID(),
        name: unwrappedAuthor.getName(),
        display_name: unwrappedAuthor.getNickname(),
        bio: unwrappedAuthor.getBio(),
        // ToDo: fill avatar, header
        avatar: '',
        header: '',
        followed_count: 0,
        following_count: 0,
      },
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
    const res = await this.renoteService.handle(
      args.originalNoteID as NoteID,
      args.content,
      args.contentsWarningComment,
      args.authorID as AccountID,
      args.attachmentFileID as MediumID[],
      args.visibility as NoteVisibility,
    );
    if (Result.isErr(res)) {
      return res;
    }
    const unwrapped = Result.unwrap(res);

    const attachmets = await this.fetchService.fetchNoteAttachments(
      unwrapped.getID(),
    );
    if (Result.isErr(attachmets)) {
      return attachmets;
    }
    const unwrappedAttachments = Result.unwrap(attachmets);

    return Result.ok({
      id: unwrapped.getID(),
      content: unwrapped.getContent(),
      visibility: unwrapped.getVisibility(),
      contents_warning_comment: unwrapped.getCwComment(),
      original_note_id: Option.unwrap(unwrapped.getOriginalNoteID()),
      author_id: unwrapped.getAuthorID(),
      attachment_files: unwrappedAttachments.map((v) => {
        return {
          id: v.getId(),
          name: v.getName(),
          mime: v.getMime(),
          url: v.getUrl(),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: v.getThumbnailUrl(),
        };
      }),
      created_at: unwrapped.getCreatedAt().toUTCString(),
    });
  }
}
