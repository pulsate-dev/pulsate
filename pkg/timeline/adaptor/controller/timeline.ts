import type { z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../../accounts/model/account.js';
import type { AccountModuleFacade } from '../../../intermodule/account.js';
import type { NoteID } from '../../../notes/model/note.js';
import type { ListID } from '../../model/list.js';
import type { AccountTimelineService } from '../../service/account.js';
import type { CreateListService } from '../../service/createList.js';
import type { DeleteListService } from '../../service/deleteList.js';
import type { FetchListMemberService } from '../../service/fetchMember.js';
import type {
  CreateListResponseSchema,
  GetAccountTimelineResponseSchema,
  GetListMemberResponseSchema,
} from '../validator/timeline.js';

export class TimelineController {
  private readonly accountTimelineService: AccountTimelineService;
  private readonly accountModule: AccountModuleFacade;
  private readonly createListService: CreateListService;
  private readonly deleteListService: DeleteListService;
  private readonly fetchMemberService: FetchListMemberService;

  constructor(args: {
    accountTimelineService: AccountTimelineService;
    accountModule: AccountModuleFacade;
    createListService: CreateListService;
    deleteListService: DeleteListService;
    fetchMemberService: FetchListMemberService;
  }) {
    this.accountTimelineService = args.accountTimelineService;
    this.accountModule = args.accountModule;
    this.createListService = args.createListService;
    this.deleteListService = args.deleteListService;
    this.fetchMemberService = args.fetchMemberService;
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

    const accountIDSet = new Set<AccountID>(
      accountNotes.map((v) => v.getAuthorID()),
    );
    const accountData = await Promise.all(
      [...accountIDSet].map((v) => this.accountModule.fetchAccount(v)),
    );

    // ToDo: N+1
    const accounts = accountData
      .filter((v) => Result.isOk(v))
      .map((v) => Result.unwrap(v));
    const accountsMap = new Map<AccountID, Account>(
      accounts.map((v) => [v.getID(), v]),
    );

    const result = accountNotes
      .filter((v) => accountsMap.has(v.getAuthorID()))
      .map((v) => {
        // biome-ignore lint/style/noNonNullAssertion: This variable is safe because it is filtered by the above filter.
        const account = accountsMap.get(v.getAuthorID())!;

        return {
          id: v.getID(),
          content: v.getContent(),
          contents_warning_comment: v.getCwComment(),
          visibility: v.getVisibility(),
          created_at: v.getCreatedAt().toUTCString(),
          author: {
            id: account.getID(),
            name: account.getName(),
            display_name: account.getNickname(),
            bio: account.getBio(),
            avatar: '',
            header: '',
            followed_count: 0,
            following_count: 0,
          },
        };
      });

    return Result.ok(result);
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
        avatar: '',
      };
    });

    return Result.ok({ assignees: res });
  }
}
