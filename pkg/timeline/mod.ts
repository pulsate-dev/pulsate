import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { AccountModule } from '../intermodule/account.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import { InMemoryTimelineRepository } from './adaptor/repository/dummy.js';
import { GetAccountTimelineRoute } from './router.js';
import { AccountTimelineService } from './service/account.js';
import { NoteVisibilityService } from './service/noteVisibility.js';

const accountModule = new AccountModule();
const timelineRepository = new InMemoryTimelineRepository();
const controller = new TimelineController({
  accountTimelineService: new AccountTimelineService({
    noteVisibilityService: new NoteVisibilityService(accountModule),
    timelineRepository: timelineRepository,
  }),
  accountModule,
});

export const timeline = new OpenAPIHono()
  .doc('/timeline/doc.json', {
    openapi: '3.0.0',
    info: {
      title: 'Timeline API',
      version: '0.1.0',
    },
  })
  .openapi(GetAccountTimelineRoute, async (c) => {
    // ToDo: get account id who is trying to see the timeline
    const { id } = c.req.param();
    const { has_attachment, no_nsfw, before_id } = c.req.valid('query');

    const res = await controller.getAccountTimeline(
      id,
      '',
      has_attachment,
      no_nsfw,
      before_id,
    );
    if (Result.isErr(res)) {
      return c.json({ error: res[1].message, status: 400 });
    }

    return c.json(res[1]);
  });
