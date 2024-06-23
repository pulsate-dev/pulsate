import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../accounts/model/account.js';
import { AccountModule } from '../intermodule/account.js';
import { Note, type NoteID } from '../notes/model/note.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import { InMemoryTimelineRepository } from './adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from './adaptor/repository/dummyCache.js';
import { GetAccountTimelineRoute, PushNoteToTimelineRoute } from './router.js';
import { AccountTimelineService } from './service/account.js';
import { NoteVisibilityService } from './service/noteVisibility.js';
import { PushTimelineService } from './service/push.js';

const accountModule = new AccountModule();
const timelineRepository = new InMemoryTimelineRepository();
const timelineNotesCacheRepository = new InMemoryTimelineCacheRepository();
const noteVisibilityService = new NoteVisibilityService(accountModule);
const controller = new TimelineController({
  accountTimelineService: new AccountTimelineService({
    noteVisibilityService: noteVisibilityService,
    timelineRepository: timelineRepository,
  }),
  accountModule,
});
const pushTimelineService = new PushTimelineService(
  accountModule,
  noteVisibilityService,
  timelineNotesCacheRepository,
);

export type TimelineModuleHandlerType = typeof pushNoteToTimeline;

export const timeline = new OpenAPIHono().doc('/timeline/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Timeline API',
    version: '0.1.0',
  },
});
timeline.openapi(GetAccountTimelineRoute, async (c) => {
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
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1], 200);
});

// ToDo: Require internal access token in this endpoint
// NOTE: This is internal endpoint
const pushNoteToTimeline = timeline.openapi(
  PushNoteToTimelineRoute,
  async (c) => {
    const { id, authorId } = c.req.valid('json');
    const res = await pushTimelineService.handle(
      Note.new({
        id: id as NoteID,
        authorID: authorId as AccountID,
        content: '',
        contentsWarningComment: '',
        createdAt: new Date(),
        originalNoteID: Option.none(),
        sendTo: Option.none(),
        attachmentFileID: [],
        visibility: 'FOLLOWERS',
      }),
    );
    if (Result.isErr(res)) {
      return c.json({ error: res[1].message, status: 400 });
    }

    return new Response(undefined, { status: 204 });
  },
);

// ToDo: impl DropNoteFromTimelineRoute
