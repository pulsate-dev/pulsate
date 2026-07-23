import { createRoute, z } from '@hono/zod-openapi';

import { AccountNotFound } from '../accounts/adaptor/presenter/errors.ts';
import {
  bearerAuth,
  errorResponse,
  internalErrorResponse,
  jsonBody,
  noContentResponse,
  okResponse,
} from '../internal/router/helper.ts';
import {
  ListNotFound,
  NoPermission,
  NothingLeft,
  TimelineInternalError,
  TitleTooLong,
  TooManyMembers,
  YouAreBlocked,
} from './adaptor/presenter/errors.ts';
import {
  CreateListRequestSchema,
  CreateListResponseSchema,
  EditListRequestSchema,
  EditListResponseSchema,
  FetchListResponseSchema,
  GetAccountTimelineResponseSchema,
  GetConversationsResponseSchema,
  GetHomeTimelineResponseSchema,
  GetListMemberResponseSchema,
  GetListTimelineResponseSchema,
  GetPublicTimelineResponseSchema,
} from './adaptor/validator/timeline.ts';

/* NOTE: query params must use z.string() \
 cf. https://zenn.dev/loglass/articles/c237d89e238d42 (Japanese)\
 cf. https://github.com/honojs/middleware/issues/200#issuecomment-1773428171 (GitHub Issue)
*/
const timelineFilterQuerySchema = z
  .object({
    has_attachment: z.coerce.boolean().optional().default(false).openapi({
      type: 'boolean',
      description: 'If true, only return notes with attachment',
    }),
    no_nsfw: z.coerce.boolean().optional().default(false).openapi({
      type: 'boolean',
      description: 'If true, only return notes without sensitive content',
    }),
    before_id: z.string().optional().openapi({
      description:
        'Return notes before this note ID. specified note ID is not included. NOTE: after_id and before_id are exclusive.',
    }),
    after_id: z.string().optional().openapi({
      description:
        'Return notes after this note ID. Specified note is not included. NOTE: after_id and before_id are exclusive.',
    }),
  })
  .openapi('TimelineFilterQuerySchema');

const timelineInternalErrorSchema = z.object({ error: TimelineInternalError });
const timelineInternalErrorSchemaWithDesc = z
  .object({ error: TimelineInternalError })
  .openapi({ description: 'Internal server error' });

const listIDParams = () =>
  z.object({
    id: z.string().openapi('List ID'),
  });

export const GetHomeTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/home',
  request: {
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: okResponse(GetHomeTimelineResponseSchema),
    404: errorResponse('Nothing left', NothingLeft),
    500: internalErrorResponse(timelineInternalErrorSchema, 'Internal error'),
  },
});

export const GetPublicTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/public',
  request: {
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: okResponse(GetPublicTimelineResponseSchema),
    404: errorResponse('Nothing left', NothingLeft),
    500: internalErrorResponse(timelineInternalErrorSchema, 'Internal error'),
  },
});

export const GetAccountTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/accounts/:id',
  request: {
    params: z.object({
      id: z.string().openapi('Account ID'),
    }),
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: okResponse(GetAccountTimelineResponseSchema),
    403: errorResponse('You are blocked by specified account', YouAreBlocked),
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: z.union([AccountNotFound, NothingLeft]).openapi({
                description: 'Error codes',
                example: 'ACCOUNT_NOT_FOUND',
              }),
            })
            .openapi({
              description: 'Account not found',
            }),
        },
      },
    },
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const GetListTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id/notes',
  request: {
    params: listIDParams(),
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: okResponse(GetListTimelineResponseSchema),
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NothingLeft, ListNotFound]).openapi({
              description: 'Error codes',
              example: 'LIST_NOT_FOUND',
            }),
          }),
        },
      },
    },
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const CreateListRoute = createRoute({
  method: 'post',
  tags: ['timeline'],
  path: '/v0/lists',
  security: bearerAuth(),
  request: {
    body: jsonBody(CreateListRequestSchema),
  },
  responses: {
    200: okResponse(CreateListResponseSchema),
    400: errorResponse('Bad request', TitleTooLong, 'List title too long'),
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const EditListRoute = createRoute({
  method: 'patch',
  tags: ['timeline'],
  path: '/v0/lists/:id',
  security: bearerAuth(),
  request: {
    params: listIDParams(),
    body: jsonBody(EditListRequestSchema),
  },
  responses: {
    200: okResponse(EditListResponseSchema),
    404: errorResponse('List not found', ListNotFound),
    400: errorResponse(
      'List title too long',
      TitleTooLong,
      'List title too long',
    ),
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const FetchListRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id',
  security: bearerAuth(),
  request: {
    params: listIDParams(),
  },
  responses: {
    200: okResponse(FetchListResponseSchema),
    404: errorResponse('List not found', ListNotFound, 'List not found'),
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const DeleteListRoute = createRoute({
  method: 'delete',
  tags: ['timeline'],
  path: '/v0/lists',
  security: bearerAuth(),
  request: {
    params: listIDParams(),
  },
  responses: {
    204: noContentResponse('OK'),
    404: errorResponse('List not found', ListNotFound, 'List not found'),
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const GetListMemberRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  responses: {
    200: okResponse(GetListMemberResponseSchema),
    404: errorResponse('List not found', ListNotFound, 'List not found'),
    500: internalErrorResponse(
      timelineInternalErrorSchemaWithDesc,
      'Internal error',
    ),
  },
});

export const AppendListMemberRoute = createRoute({
  method: 'post',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  security: bearerAuth(),
  request: {
    params: listIDParams(),
    body: jsonBody(
      z.object({
        account_id: z.string().openapi('Account ID'),
      }),
    ),
  },
  responses: {
    204: noContentResponse('OK'),
    400: errorResponse('Too many members', TooManyMembers),
    403: {
      description: 'You do not have permission to add member to this list',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NoPermission, YouAreBlocked]),
          }),
        },
      },
    },
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([ListNotFound, AccountNotFound]),
          }),
        },
      },
    },
  },
});

export const DeleteListMemberRoute = createRoute({
  method: 'delete',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  security: bearerAuth(),
  request: {
    params: listIDParams(),
    body: jsonBody(
      z.object({
        account_id: z.string().openapi('Account ID'),
      }),
    ),
  },
  responses: {
    204: noContentResponse('OK'),
    403: {
      description: 'You do not have permission to remove member to this list',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NoPermission, YouAreBlocked]),
          }),
        },
      },
    },
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([ListNotFound, AccountNotFound]),
          }),
        },
      },
    },
  },
});

export const GetBookmarkTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/bookmarks',
  request: {
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: okResponse(GetHomeTimelineResponseSchema),
    404: errorResponse('Nothing left', NothingLeft),
    500: internalErrorResponse(timelineInternalErrorSchema, 'Internal error'),
  },
});

export const GetConversationRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/conversations',
  request: {},
  responses: {
    200: okResponse(GetConversationsResponseSchema),
    500: internalErrorResponse(timelineInternalErrorSchema, 'Internal error'),
  },
});
