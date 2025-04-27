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
import type { FetchBookmarkService } from '../../service/fetchBookmark.js';
import type { FetchListService } from '../../service/fetchList.js';
import type { FetchListMemberService } from '../../service/fetchMember.js';
import type { HomeTimelineService } from '../../service/home.js';
import type { ListTimelineService } from '../../service/list.js';
import type { RemoveListMemberService } from '../../service/removeMember.js';
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
  private readonly removeListMemberService: RemoveListMemberService;
  private readonly fetchBookmarkTimelineService: FetchBookmarkService;

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
    removeListMemberService: RemoveListMemberService;
    fetchBookmarkTimelineService: FetchBookmarkService;
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
    this.removeListMemberService = args.removeListMemberService;
    this.fetchBookmarkTimelineService = args.fetchBookmarkTimelineService;
  }

  private async getNoteAdditionalData(notes: readonly Note[]): Promise<
    Result.Result<
      Error,
      {
        note: Note;
        author: Account;
        header: string;
        avatar: string;
        followCount: {
          followed: number;
          following: number;
        };
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

    // [header,avatar]
    const headerAvatarImages = new Map<AccountID, [string, string]>();
    const followCounts = new Map<
      AccountID,
      { following: number; followers: number }
    >();
    for (const id of accountsMap.keys()) {
      const headerRes = await this.accountModule.fetchAccountHeader(id);
      const header = Result.unwrapOr('')(headerRes);

      const avatarRes = await this.accountModule.fetchAccountAvatar(id);
      const avatar = Result.unwrapOr('')(avatarRes);
      headerAvatarImages.set(id, [header, avatar]);

      const followCountRes = await this.accountModule.fetchFollowCount(id);
      const followCount = Result.unwrapOr({ following: 0, followers: 0 })(
        followCountRes,
      );
      followCounts.set(id, followCount);
    }

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
          const [header, avatar] = headerAvatarImages.get(author.getID()) ?? [
            '',
            '',
          ];
          const followCount = followCounts.get(author.getID()) ?? {
            following: 0,
            followers: 0,
          };

          return {
            note,
            author,
            reactions,
            attachments,
            header,
            avatar,
            followCount: {
              followed: followCount.followers,
              following: followCount.following,
            },
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
          avatar: v.avatar,
          header: v.header,
          followed_count: v.followCount.followed,
          following_count: v.followCount.following,
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
    afterID?: string,
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
        afterID: afterID as NoteID,
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
          avatar: v.avatar,
          header: v.header,
          followed_count: v.followCount.followed,
          following_count: v.followCount.following,
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

    const additionalDataRes = await this.getNoteAdditionalData(notes);
    if (Result.isErr(additionalDataRes)) {
      return additionalDataRes;
    }
    const additionalData = Result.unwrap(additionalDataRes);

    return Result.ok(
      additionalData.map((v) => {
        return {
          id: v.note.getID(),
          content: v.note.getContent(),
          contents_warning_comment: v.note.getCwComment(),
          visibility: v.note.getVisibility(),
          created_at: v.note.getCreatedAt().toUTCString(),
          attachment_files: v.attachments.map((file) => {
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
          }),
          reactions: v.reactions.map((reaction) => {
            return {
              emoji: reaction.getEmoji(),
              reacted_by: reaction.getAccountID(),
            };
          }),
          author: {
            id: v.author.getID(),
            name: v.author.getName(),
            display_name: v.author.getNickname(),
            bio: v.author.getBio(),
            avatar: v.avatar,
            header: v.header,
            followed_count: v.followCount.followed,
            following_count: v.followCount.following,
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

  async removeListMember(
    listID: string,
    memberID: string,
    actorID: string,
  ): Promise<Result.Result<Error, void>> {
    return this.removeListMemberService.handle(
      listID as ListID,
      memberID as AccountID,
      actorID as AccountID,
    );
  }

  async getBookmarkTimeline(
    accountID: string,
    hasAttachment: boolean,
    noNsfw: boolean,
    beforeId?: string,
    afterId?: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetAccountTimelineResponseSchema>>
  > {
    const res =
      await this.fetchBookmarkTimelineService.fetchBookmarkByAccountID(
        accountID as AccountID,
        {
          hasAttachment,
          noNsfw,
          beforeId: beforeId as NoteID,
          afterID: afterId as NoteID,
        },
      );
    if (Result.isErr(res)) {
      return res;
    }

    const noteIDs = Result.unwrap(res);

    const notesRes =
      await this.fetchBookmarkTimelineService.fetchBookmarkNotes(noteIDs);
    if (Result.isErr(notesRes)) {
      return notesRes;
    }

    const noteAdditionalDataRes = await this.getNoteAdditionalData(
      Result.unwrap(notesRes),
    );
    if (Result.isErr(noteAdditionalDataRes)) {
      return noteAdditionalDataRes;
    }
    const noteAdditionalData = Result.unwrap(noteAdditionalDataRes);

    const result = noteAdditionalData.map((v) => ({
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
        avatar: v.avatar,
        header: v.header,
        followed_count: v.followCount.followed,
        following_count: v.followCount.following,
      },
    }));

    return Result.ok(result);
  }
}
