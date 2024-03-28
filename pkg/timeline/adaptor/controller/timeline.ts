import { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type {
  AccountID,
  AccountName,
} from '../../../accounts/model/account.js';
import type { FetchAccountService } from '../../../accounts/service/fetchAccount.js';
import type { FetchAccountFollowService } from '../../../accounts/service/fetchAccountFollow.js';
import type { ID } from '../../../id/type.js';
import type { NoteFilter } from '../../../notes/model/repository.js';
import type { FetchNoteService } from '../../../notes/service/fetch.js';
import type { NoteSchema } from '../validator/schema.js';

export class TimelineController {
  constructor(
    private readonly fetchAccountService: FetchAccountService,
    private readonly fetchAccountFollowService: FetchAccountFollowService,
    private readonly fetchNoteService: FetchNoteService,
  ) {}

  async getTimeline({
    target,
    hasAttachment,
    isNsfw,
    beforeID,
  }: {
    target?: string;
    hasAttachment?: boolean;
    isNsfw?: boolean;
    beforeID?: string;
  }): Promise<Result.Result<Error, z.infer<typeof NoteSchema>[]>> {
    const filters: NoteFilter[] = [];

    if (target !== undefined) {
      const resFollows = isID<AccountID>(target)
        ? await this.fetchAccountFollowService.fetchFollowsByID(target)
        : isAccountName(target)
          ? await this.fetchAccountFollowService.fetchFollowsByName(target)
          : panic();

      if (Result.isErr(resFollows)) {
        return resFollows;
      }

      filters.push({
        type: 'author',
        any: resFollows[1].map((af) => af.getTargetID()),
      });
    }

    if (hasAttachment !== undefined) {
      filters.push({ type: 'attachment', more: hasAttachment ? 0 : -1 });
    }

    if (isNsfw !== undefined) {
      filters.push({ type: 'cw', is: 'nsfw' });
    }

    if (beforeID !== undefined && isID<AccountID>(beforeID)) {
      const beforeNote = await this.fetchNoteService
        .fetchNoteByID(beforeID)
        .then((o) => Option.unwrap(o));

      filters.push({ type: 'created', less: beforeNote.getCreatedAt() });
    }

    const resNotes = await this.fetchNoteService.fetchNotesWithFilters(filters);
    if (Result.isErr(resNotes)) {
      return resNotes;
    }

    const notes = [];
    for (const n of resNotes[1]) {
      const resAccount = await this.fetchAccountService.fetchAccountByID(
        n.getAuthorID(),
      );

      if (Result.isErr(resAccount)) {
        return resAccount;
      }

      const a = resAccount[1];

      notes.push({
        id: n.getID(),
        content: n.getContent(),
        contents_warning_comment: n.getCwComment(),
        send_to: n.getSendTo()[1],
        visibility: n.getVisibility(),
        created_at: n.getCreatedAt().toUTCString(),
        author: {
          id: a.getID(),
          name: a.getName(),
          display_name: a.getNickname(),
          bio: a.getBio(),
          avatar: '',
          header: '',
          followed_count: 0,
          following_count: 0,
        },
      });
    }

    return Result.ok(notes);
  }
}

const isID = <T>(s: string): s is ID<T> => {
  return z
    .string()
    .regex(/^\d{64}$/)
    .safeParse(s).success;
};

const isAccountName = (s: string): s is AccountName => {
  return /@\w+@\w+/.test(s);
};

const panic = () => {
  throw new Error('panic!');
};
