import type { z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../../accounts/model/account.js';
import type { Medium } from '../../../drive/model/medium.js';
import type { AccountModuleFacade } from '../../../intermodule/account.js';
import type { NoteModuleFacade } from '../../../intermodule/note.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import type { Reaction } from '../../../notes/model/reaction.js';
import type { ListID } from '../../model/list.js';
import type { AccountTimelineService } from '../../service/account.js';
import type { AppendListMemberService } from '../../service/appendMember.js';
import type { CreateListService } from '../../service/createList.js';
import type { DeleteListService } from '../../service/deleteList.js';
import type { EditListService } from '../../service/editList.js';
import type { FetchListService } from '../../service/fetchList.js';
import type { FetchListMemberService } from '../../service/fetchMember.js';
import type { HomeTimelineService } from '../../service/home.js';
import type { ListTimelineService } from '../../service/list.js';
import type {
  CreateListResponseSchema,
  EditListRequestSchema,
  EditListResponseSchema,
  FetchListResponseSchema,
  GetAccountTimelineResponseSchema,
  GetHomeTimelineResponseSchema,
  GetListMemberResponseSchema,
  GetListTimelineResponseSchema,
} from '../validator/timeline.js';

export class TimelineController {
  private readonly accountTimelineService: AccountTimelineService;
  private readonly accountModule: AccountModuleFacade;
  private readonly createListService: CreateListService;
  private readonly editListService: EditListService;
  private readonly fetchListService: FetchListService;
  private readonly deleteListService: DeleteListService;
  private readonly fetchMemberService: FetchListMemberService;
  private readonly listTimelineService: ListTimelineService;
  private readonly noteModule: NoteModuleFacade;
  private readonly homeTimeline: HomeTimelineService;
  private readonly appendListMemberService: AppendListMemberService;

  constructor(args: {
    accountTimelineService: AccountTimelineService;
    accountModule: AccountModuleFacade;
    createListService: CreateListService;
    editListService: EditListService;
    fetchListService: FetchListService;
    deleteListService: DeleteListService;
    fetchMemberService: FetchListMemberService;
    listTimelineService: ListTimelineService;
    noteModule: NoteModuleFacade;
    homeTimeline: HomeTimelineService;
    appendListMemberService: AppendListMemberService;
  }) {
    this.accountTimelineService = args.accountTimelineService;
    this.accountModule = args.accountModule;
    this.createListService = args.createListService;
    this.editListService = args.editListService;
    this.fetchListService = args.fetchListService;
    this.deleteListService = args.deleteListService;
    this.fetchMemberService = args.fetchMemberService;
    this.listTimelineService = args.listTimelineService;
    this.noteModule = args.noteModule;
    this.homeTimeline = args.homeTimeline;
    this.appendListMemberService = args.appendListMemberService;
  }

  private async getNoteAdditionalData(notes: readonly Note[]): Promise<
    Result.Result<
      Error,
      {
        note: Note;
        author: Account;
        reactions: Reaction[];
        attachments: Medium[];
      }[]
    >
  > {
    const accountData = await this.accountModule.fetchAccounts(
      notes.map((v) => v.getAuthorID()),
    );
    if (Result.isErr(accountData)) {
      return accountData;
    }
    const accounts = Result.unwrap(accountData);
    const accountsMap = new Map<AccountID, Account>(
      accounts.map((v) => [v.getID(), v]),
    );

    const attachmentsMap = new Map<NoteID, Medium[]>();
    const reactionsMap = new Map<NoteID, Reaction[]>();
    for (const v of notes) {
      const attachmentsRes = await this.noteModule.fetchAttachments(v.getID());
      attachmentsMap.set(v.getID(), Result.unwrap(attachmentsRes));
      const reactionsRes = await this.noteModule.fetchReactions(v.getID());
      reactionsMap.set(v.getID(), Result.unwrap(reactionsRes));
    }

    return Result.ok(
      notes
        .filter((v) => accountsMap.has(v.getAuthorID()))
        .map((note) => {
          // biome-ignore lint/style/noNonNullAssertion: This variable is safe because it is filtered by the above filter.
          const author = accountsMap.get(note.getAuthorID())!;
          const attachments = attachmentsMap.get(note.getID()) ?? [];
          const reactions = reactionsMap.get(note.getID()) ?? [];

          return {
            note,
            author,
            reactions,
            attachments,
          };
        }),
    );
  }

  async getHomeTimeline(
    actorID: string,
    hasAttachment: boolean,
    noNsfw: boolean,
    beforeId?: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetHomeTimelineResponseSchema>>
  > {
    const res = await this.homeTimeline.fetchHomeTimeline(
      actorID as AccountID,
      {
        hasAttachment,
        noNsfw,
        beforeId: beforeId as NoteID | undefined,
      },
    );
    if (Result.isErr(res)) {
      return res;
    }
    const accountNotes = Result.unwrap(res);

    const noteAdditionalDataRes =
      await this.getNoteAdditionalData(accountNotes);
    if (Result.isErr(res)) {
      return res;
    }
    const noteAdditionalData = Result.unwrap(noteAdditionalDataRes);

    const result = noteAdditionalData.map((v) => {
      return {
        id: v.note.getID(),
        content: v.note.getContent(),
        contents_warning_comment: v.note.getCwComment(),
        visibility: v.note.getVisibility(),
        created_at: v.note.getCreatedAt().toUTCString(),
        reactions: v.reactions.map((reaction) => ({
          emoji: reaction.getEmoji(),
          reacted_by: reaction.getAccountID(),
        })),
        attachment_files: v.attachments.map((file) => ({
          id: file.getId(),
          name: file.getName(),
          author_id: file.getAuthorId(),
          hash: file.getHash(),
          mime: file.getMime(),
          nsfw: file.isNsfw(),
          url: file.getUrl(),
          thumbnail: file.getThumbnailUrl(),
        })),
        author: {
          id: v.author.getID(),
          name: v.author.getName(),
          display_name: v.author.getNickname(),
          bio: v.author.getBio(),
          avatar: '',
          header: '',
          followed_count: 0,
          following_count: 0,
        },
      };
    });

    return Result.ok(result);
  }

  async getAccountTimeline(
    targetId: string,
    fromId: string,
    hasAttachment: boolean,
    noNsfw: boolean,
    beforeId?: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetAccountTimelineResponseSchema>>
  > {
    const res = await this.accountTimelineService.handle(
      targetId as AccountID,
      {
        id: fromId as AccountID,
        hasAttachment,
        noNsfw,
        beforeId: beforeId as NoteID,
      },
    );
    if (Result.isErr(res)) {
      return res;
    }
    const accountNotes = Result.unwrap(res);
    const noteAdditionalDataRes =
      await this.getNoteAdditionalData(accountNotes);
    if (Result.isErr(noteAdditionalDataRes)) {
      return noteAdditionalDataRes;
    }
    const noteAdditionalData = Result.unwrap(noteAdditionalDataRes);

    const result = noteAdditionalData.map((v) => {
      return {
        id: v.note.getID(),
        content: v.note.getContent(),
        contents_warning_comment: v.note.getCwComment(),
        visibility: v.note.getVisibility(),
        created_at: v.note.getCreatedAt().toUTCString(),
        reactions: v.reactions.map((reaction) => ({
          emoji: reaction.getEmoji(),
          reacted_by: reaction.getAccountID(),
        })),
        attachment_files: v.attachments.map((file) => ({
          id: file.getId(),
          name: file.getName(),
          author_id: file.getAuthorId(),
          hash: file.getHash(),
          mime: file.getMime(),
          nsfw: file.isNsfw(),
          url: file.getUrl(),
          thumbnail: file.getThumbnailUrl(),
        })),
        author: {
          id: v.author.getID(),
          name: v.author.getName(),
          display_name: v.author.getNickname(),
          bio: v.author.getBio(),
          avatar: '',
          header: '',
          followed_count: 0,
          following_count: 0,
        },
      };
    });

    return Result.ok(result);
  }

  // ToDo: add filter,pagination
  async getListTimeline(
    listID: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetListTimelineResponseSchema>>
  > {
    const notesRes = await this.listTimelineService.handle(listID as ListID);
    if (Result.isErr(notesRes)) {
      return notesRes;
    }
    const notes = Result.unwrap(notesRes);
    const attachmentsMap = new Map<NoteID, Medium[]>();
    const reactionsMap = new Map<NoteID, Reaction[]>();
    const noteAuthorMap = new Map<AccountID, Account>();

    const noteAuthor = new Set<AccountID>(notes.map((v) => v.getAuthorID()));
    const noteAuthorRes = await this.accountModule.fetchAccounts([
      ...noteAuthor,
    ]);
    if (Result.isErr(noteAuthorRes)) {
      return noteAuthorRes;
    }
    for (const author of Result.unwrap(noteAuthorRes)) {
      noteAuthorMap.set(author.getID(), author);
    }

    for (const v of notes) {
      const attachmentsRes = await this.noteModule.fetchAttachments(v.getID());
      if (Result.isErr(attachmentsRes)) {
        return attachmentsRes;
      }
      const attachments = Result.unwrap(attachmentsRes);
      attachmentsMap.set(v.getID(), attachments);

      const reactionsRes = await this.noteModule.fetchReactions(v.getID());
      if (Result.isErr(reactionsRes)) {
        return reactionsRes;
      }
      const reactions = Result.unwrap(reactionsRes);
      reactionsMap.set(v.getID(), reactions);
    }

    return Result.ok(
      notes.map((v) => {
        const author = noteAuthorMap.get(v.getAuthorID()) as Account;

        return {
          id: v.getID(),
          content: v.getContent(),
          contents_warning_comment: v.getCwComment(),
          visibility: v.getVisibility(),
          created_at: v.getCreatedAt().toUTCString(),
          attachment_files:
            attachmentsMap.get(v.getID())?.map((file) => {
              return {
                id: file.getId(),
                name: file.getName(),
                author_id: file.getAuthorId(),
                hash: file.getHash(),
                mime: file.getMime(),
                nsfw: file.isNsfw(),
                url: file.getUrl(),
                thumbnail: file.getThumbnailUrl(),
              };
            }) ?? [],
          reactions:
            reactionsMap.get(v.getID())?.map((reaction) => {
              return {
                emoji: reaction.getEmoji(),
                reacted_by: reaction.getAccountID(),
              };
            }) ?? [],
          author: {
            id: author.getID(),
            name: author.getName(),
            display_name: author.getNickname(),
            bio: author.getBio(),
            // ToDo: fill avatar, header, followed/following counts
            avatar: '',
            header: '',
            followed_count: 0,
            following_count: 0,
          },
        };
      }),
    );
  }

  async createList(
    title: string,
    isPublic: boolean,
    ownerId: string,
  ): Promise<Result.Result<Error, z.infer<typeof CreateListResponseSchema>>> {
    const res = await this.createListService.handle(
      title,
      isPublic,
      ownerId as AccountID,
    );
    if (Result.isErr(res)) {
      return res;
    }

    const unwrapped = Result.unwrap(res);
    return Result.ok({
      id: unwrapped.getId(),
      title: unwrapped.getTitle(),
      public: unwrapped.isPublic(),
    });
  }

  async editList(
    id: string,
    data: z.infer<typeof EditListRequestSchema>,
  ): Promise<Result.Result<Error, z.infer<typeof EditListResponseSchema>>> {
    if (data.title) {
      const res = await this.editListService.editTitle(
        id as ListID,
        data.title,
      );

      if (Result.isErr(res)) {
        return res;
      }
    }

    if (data.public !== undefined) {
      const res = await this.editListService.editPublicity(
        id as ListID,
        data.public ? 'PUBLIC' : 'PRIVATE',
      );

      if (Result.isErr(res)) {
        return res;
      }
    }

    const res = await this.fetchListService.handle(id as ListID);

    if (Result.isErr(res)) {
      return res;
    }

    const list = Result.unwrap(res);

    return Result.ok({
      id: list.getId(),
      title: list.getTitle(),
      public: list.isPublic(),
    });
  }

  async fetchList(
    id: string,
  ): Promise<Result.Result<Error, z.infer<typeof FetchListResponseSchema>>> {
    const res = await this.fetchListService.handle(id as ListID);
    if (Result.isErr(res)) {
      return res;
    }

    const unwrapped = Result.unwrap(res);

    return Result.ok({
      id: unwrapped.getId(),
      title: unwrapped.getTitle(),
      public: unwrapped.isPublic(),
    });
  }

  async deleteList(id: string): Promise<Result.Result<Error, void>> {
    const res = await this.deleteListService.handle(id as ListID);
    return res;
  }

  async getListMembers(
    id: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetListMemberResponseSchema>>
  > {
    const accounts = await this.fetchMemberService.handle(id as ListID);
    if (Result.isErr(accounts)) {
      return accounts;
    }

    const unwrapped = Result.unwrap(accounts);
    const res = unwrapped.map((v) => {
      return {
        id: v.getID(),
        name: v.getName(),
        nickname: v.getNickname(),
        // ToDo: fill avatar URL
        avatar: '',
      };
    });

    return Result.ok({ assignees: res });
  }

  async appendListMember(
    listID: string,
    memberID: string,
    actorID: string,
  ): Promise<Result.Result<Error, void>> {
    return this.appendListMemberService.handle(
      listID as ListID,
      memberID as AccountID,
      actorID as AccountID,
    );
  }
}
