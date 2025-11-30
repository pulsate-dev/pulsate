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
    const noteRes = await this.createService.handle(
      args.content,
      args.contentsWarningComment,
      !args.sendTo ? Option.none() : Option.some(args.sendTo as AccountID),
      args.authorID as AccountID,
      args.attachmentFileID as MediumID[],
      args.visibility as NoteVisibility,
    );
    if (Result.isErr(noteRes)) {
      return noteRes;
    }

    const note = Result.unwrap(noteRes);
    const attachmentsRes = await this.fetchService.fetchNoteAttachments(
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
      send_to: Option.isSome(note.getSendTo())
        ? Option.unwrap(note.getSendTo())
        : undefined,
      author_id: note.getAuthorID(),
      created_at: note.getCreatedAt().toUTCString(),
      attachment_files: attachments.map((v) => {
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
    accountID: Option.Option<AccountID>,
  ): Promise<Result.Result<Error, z.infer<typeof GetNoteResponseSchema>>> {
    const noteRes = await this.fetchService.fetchNoteByID(noteID as NoteID);
    if (Option.isNone(noteRes)) {
      return Result.err(new Error('Note not found'));
    }
    const note = Option.unwrap(noteRes);

    const authorAccountRes = await this.accountModule.fetchAccount(
      note.getAuthorID(),
    );
    if (Result.isErr(authorAccountRes)) {
      return authorAccountRes;
    }
    const author = Result.unwrap(authorAccountRes);

    const attachmentsRes = await this.fetchService.fetchNoteAttachments(
      note.getID(),
    );
    if (Result.isErr(attachmentsRes)) {
      return attachmentsRes;
    }
    const attachments = Result.unwrap(attachmentsRes);

    const reactionsRes = await this.fetchService.fetchNoteReactions(
      note.getID(),
    );
    if (Result.isErr(reactionsRes)) {
      return reactionsRes;
    }
    const reactions = Result.unwrap(reactionsRes);

    // FIXME: complex 3ternary operator
    const isRenoted = Option.isSome(accountID)
      ? (
          await this.fetchService.fetchRenoteStatus(Option.unwrap(accountID), [
            note.getID(),
          ])
        )[0]?.getIsRenoted() || false
      : false;

    return Result.ok({
      id: note.getID(),
      content: note.getContent(),
      contents_warning_comment: note.getCwComment(),
      send_to: Option.isSome(note.getSendTo())
        ? Option.unwrap(note.getSendTo())
        : undefined,
      visibility: note.getVisibility(),
      created_at: note.getCreatedAt().toUTCString(),
      attachment_files: attachments.map((v) => {
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
      reactions: reactions.map((v) => {
        return {
          emoji: v.getEmoji(),
          reacted_by: v.getAccountID(),
        };
      }),
      author: {
        id: author.getID(),
        name: author.getName(),
        display_name: author.getNickname(),
        bio: author.getBio(),
        // ToDo: fill avatar, header
        avatar: '',
        header: '',
        followed_count: 0,
        following_count: 0,
      },
      renoted: isRenoted,
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
    const renoteRes = await this.renoteService.handle(
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

    const attachmentsRes = await this.fetchService.fetchNoteAttachments(
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
          url: v.getUrl(),
          hash: v.getHash(),
          author_id: v.getAuthorId(),
          nsfw: v.isNsfw(),
          thumbnail: v.getThumbnailUrl(),
        };
      }),
      created_at: renote.getCreatedAt().toUTCString(),
    });
  }
}
