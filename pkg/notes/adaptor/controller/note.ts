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

  async getNoteByID(
    noteID: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetNoteResponseSchema>>> {
    const res = await this.fetchService.fetchNoteByID(noteID as NoteID);
    if (Option.isNone(res)) {
      return Result.err(new Error('Note not found'));
    }

    const authorAccount = await this.accountModule.fetchAccount(
      res[1].getAuthorID(),
    );

    if (Result.isErr(authorAccount)) {
      return authorAccount;
    }

    return Result.ok({
      id: res[1].getID(),
      content: res[1].getContent(),
      contents_warning_comment: res[1].getCwComment(),
      send_to: Option.isSome(res[1].getSendTo())
        ? Option.unwrap(res[1].getSendTo())
        : undefined,
      visibility: res[1].getVisibility(),
      created_at: res[1].getCreatedAt().toUTCString(),
      // ToDo: return AttachmentFile meta data
      attachment_files: [],
      author: {
        id: authorAccount[1].getID(),
        name: authorAccount[1].getName(),
        display_name: authorAccount[1].getNickname(),
        bio: authorAccount[1].getBio(),
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

    return Result.ok({
      id: res[1].getID(),
      content: res[1].getContent(),
      visibility: res[1].getVisibility(),
      contents_warning_comment: res[1].getCwComment(),
      original_note_id: Option.unwrap(res[1].getOriginalNoteID()),
      author_id: res[1].getAuthorID(),
      // ToDo: return AttachmentFile meta data
      attachment_files: [],
      created_at: res[1].getCreatedAt().toUTCString(),
    });
  }
}
