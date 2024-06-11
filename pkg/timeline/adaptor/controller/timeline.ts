import { type z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import {
  type Account,
  type AccountID,
} from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import type { AccountModule } from '../../../intermodule/account.js';
import type { AccountTimelineService } from '../../service/account.js';
import type { GetAccountTimelineResponseSchema } from '../validator/timeline.js';

export class TimelineController {
  private readonly accountTimelineService: AccountTimelineService;
  private readonly accountModule: AccountModule;
  constructor(args: {
    accountTimelineService: AccountTimelineService;
    accountModule: AccountModule;
  }) {
    this.accountTimelineService = args.accountTimelineService;
    this.accountModule = args.accountModule;
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
      targetId as ID<AccountID>,
      {
        id: fromId as ID<AccountID>,
        hasAttachment,
        noNsfw,
        beforeId: beforeId as ID<string>,
      },
    );
    if (Result.isErr(res)) {
      return res;
    }
    const accountIDSet = new Set<ID<AccountID>>(
      res[1].map((v) => v.getAuthorID()),
    );
    const accountData = await Promise.all(
      [...accountIDSet].map(
        async (v) => await this.accountModule.fetchAccount(v),
      ),
    );

    // ToDo: N+1
    const accounts = accountData
      .filter((v) => Result.isOk(v))
      .map((v) => Result.unwrap(v));
    const accountsMap = new Map<ID<AccountID>, Account>(
      accounts.map((v) => [v.getID(), v]),
    );

    try {
      const result = res[1].map((v) => {
        const account = accountsMap.get(v.getAuthorID());
        if (!account) {
          throw new Error('Account not found');
        }
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
    } catch (e) {
      return Result.err(e as Error);
    }
  }
}
