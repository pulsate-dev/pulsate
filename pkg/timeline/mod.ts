import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
} from '../accounts/adaptor/repository/dummy.js';
import { controller as accountController } from '../accounts/mod.js';
import { FetchAccountService } from '../accounts/service/fetchAccount.js';
import { FetchAccountFollowService } from '../accounts/service/fetchAccountFollow.js';
import { AccountModule } from '../intermodule/account.js';
import { InMemoryNoteRepository } from '../notes/adaptor/repository/dummy.js';
import { FetchNoteService } from '../notes/service/fetch.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import { GetTimelineRoute, GetTimelineByAccountRoute } from './router.js';

export const timeline = new OpenAPIHono();

const accountRepository = new InMemoryAccountRepository();
const accountFollowRepository = new InMemoryAccountFollowRepository();
const accountModule = new AccountModule(accountController);

const noteRepository = new InMemoryNoteRepository();

const controller = new TimelineController(
  new FetchAccountService(accountRepository),
  new FetchAccountFollowService(accountFollowRepository, accountRepository),
  new FetchNoteService(noteRepository, accountModule),
);

timeline.doc('/timeline/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Timeline API',
    version: '0.1.0',
  },
});

timeline.openapi(GetTimelineRoute, async (c) => {
  const { type } = GetTimelineRoute.request.params.parse(c.req.param());
  const { has_attachment, no_nsfw, before_id } =
    GetTimelineRoute.request.query.parse(c.req.query());

  const spec =
    type === 'global'
      ? undefined
      : (() => {
          throw new Error();
        })();

  const res = await controller.getTimeline({
    target: spec,
    hasAttachment: has_attachment,
    isNsfw: no_nsfw ? false : undefined,
    beforeID: before_id,
  });

  // FIXME: 特に何も考えてない
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});

timeline.openapi(GetTimelineByAccountRoute, async (c) => {
  const { spec } = GetTimelineByAccountRoute.request.params.parse(
    c.req.param(),
  );
  const { has_attachment, no_nsfw, before_id } =
    GetTimelineByAccountRoute.request.query.parse(c.req.query());

  const res = await controller.getTimeline({
    target: spec,
    hasAttachment: has_attachment,
    isNsfw: no_nsfw ? false : undefined,
    beforeID: before_id,
  });

  // FIXME: 特に何も考えてない
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});
