import type { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { MediumID } from '../../../drive/model/medium.ts';
import type { AccountModuleFacade } from '../../../intermodule/account.ts';
import type { NoteID, NoteVisibility } from '../../model/note.ts';
import type { CreateService } from '../../service/create.ts';
import type { FetchService } from '../../service/fetch.ts';
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
  readonly #accountModule: AccountModuleFacade;
  constructor(
    createService: CreateService,
    fetchService: FetchService,
    renoteService: RenoteService,
    accountModule: AccountModuleFacade,
  ) {
    this.#createService = createService;
    this.#fetchService = fetchService;
    this.#renoteService = renoteService;
    this.#accountModule = accountModule;
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
    accountID: Option.Option<AccountID>,
  ): Promise<Result.Result<Error, z.infer<typeof GetNoteResponseSchema>>> {
    const noteRes = await this.#fetchService.fetchNoteByID(noteID as NoteID);
    if (Option.isNone(noteRes)) {
      return Result.err(new Error('Note not found'));
    }
    const note = Option.unwrap(noteRes);

    const authorAccountRes = await this.#accountModule.fetchAccount(
      note.getAuthorID(),
    );
    if (Result.isErr(authorAccountRes)) {
      return authorAccountRes;
    }
    const author = Result.unwrap(authorAccountRes);

    const attachmentsRes = await this.#fetchService.fetchNoteAttachments(
      note.getID(),
    );
    if (Result.isErr(attachmentsRes)) {
      return attachmentsRes;
    }
    const attachments = Result.unwrap(attachmentsRes);

    const reactionsRes = await this.#fetchService.fetchNoteReactions(
      note.getID(),
    );
    if (Result.isErr(reactionsRes)) {
      return reactionsRes;
    }
    const reactions = Result.unwrap(reactionsRes);

    // FIXME: complex 3ternary operator
    const isRenoted = Option.isSome(accountID)
      ? (
          await this.#fetchService.fetchRenoteStatus(Option.unwrap(accountID), [
            note.getID(),
          ])
        )[0]?.getIsRenoted() || false
      : false;

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
