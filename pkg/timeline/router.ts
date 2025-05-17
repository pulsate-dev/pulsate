import { createRoute, z } from '@hono/zod-openapi';

import { AccountNotFound } from '../accounts/adaptor/presenter/errors.js';
import {
  ListNotFound,
  NoPermission,
  NothingLeft,
  TimelineInternalError,
  TitleTooLong,
  TooManyMembers,
  YouAreBlocked,
} from './adaptor/presenter/errors.js';
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
} from './adaptor/validator/timeline.js'; /* NOTE: query params must use z.string() \
 cf. https://zenn.dev/loglass/articles/c237d89e238d42 (Japanese)\
 cf. https://github.com/honojs/middleware/issues/200#issuecomment-1773428171 (GitHub Issue)
*/

/* NOTE: query params must use z.string() \
 cf. https://zenn.dev/loglass/articles/c237d89e238d42 (Japanese)\
 cf. https://github.com/honojs/middleware/issues/200#issuecomment-1773428171 (GitHub Issue)
*/
const timelineFilterQuerySchema = z
  .object({
    has_attachment: z
      .string()
      .optional()
      .pipe(z.coerce.boolean().default(false))
      .openapi({
        type: 'boolean',
        description: 'If true, only return notes with attachment',
      }),
    no_nsfw: z
      .string()
      .optional()
      .pipe(z.coerce.boolean().default(false))
      .openapi({
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

export const GetHomeTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/home',
  request: {
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetHomeTimelineResponseSchema,
        },
      },
    },
    404: {
      description: 'Nothing left',
      content: {
        'application/json': {
          schema: z.object({
            error: NothingLeft,
          }),
        },
      },
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z.object({
            error: TimelineInternalError,
          }),
        },
      },
    },
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetAccountTimelineResponseSchema,
        },
      },
    },
    403: {
      description: 'You are blocked by specified account',
      content: {
        'application/json': {
          schema: z.object({
            error: YouAreBlocked,
          }),
        },
      },
    },
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
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const GetListTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id/notes',
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
    query: timelineFilterQuerySchema,
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetListTimelineResponseSchema,
        },
      },
    },
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
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const CreateListRoute = createRoute({
  method: 'post',
  tags: ['timeline'],
  path: '/v0/lists',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    body: {
      content: { 'application/json': { schema: CreateListRequestSchema } },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CreateListResponseSchema,
        },
      },
      description: 'OK',
    },
    400: {
      content: {
        'application/json': {
          schema: z
            .object({
              error: TitleTooLong,
            })
            .openapi({
              description: 'List title too long',
            }),
        },
      },
      description: 'Bad request',
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const EditListRoute = createRoute({
  method: 'patch',
  tags: ['timeline'],
  path: '/v0/lists/:id',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: EditListRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: EditListResponseSchema,
        },
      },
    },
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: z.object({
            error: ListNotFound,
          }),
        },
      },
    },
    400: {
      description: 'List title too long',
      content: {
        'application/json': {
          schema: z.object({ error: TitleTooLong }).openapi({
            description: 'List title too long',
          }),
        },
      },
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const FetchListRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: FetchListResponseSchema,
        },
      },
    },
    404: {
      content: {
        'application/json': {
          schema: z
            .object({
              error: ListNotFound,
            })
            .openapi({
              description: 'List not found',
            }),
        },
      },
      description: 'List not found',
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const DeleteListRoute = createRoute({
  method: 'delete',
  tags: ['timeline'],
  path: '/v0/lists',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
  },
  responses: {
    204: {
      description: 'OK',
    },
    404: {
      content: {
        'application/json': {
          schema: z
            .object({
              error: ListNotFound,
            })
            .openapi({
              description: 'List not found',
            }),
        },
      },
      description: 'List not found',
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const GetListMemberRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetListMemberResponseSchema,
        },
      },
    },
    404: {
      content: {
        'application/json': {
          schema: z
            .object({
              error: ListNotFound,
            })
            .openapi({
              description: 'List not found',
            }),
        },
      },
      description: 'List not found',
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: TimelineInternalError,
            })
            .openapi({
              description: 'Internal server error',
            }),
        },
      },
    },
  },
});

export const AppendListMemberRoute = createRoute({
  method: 'post',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            account_id: z.string().openapi('Account ID'),
          }),
        },
      },
    },
  },
  responses: {
    204: {
      description: 'OK',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: TooManyMembers,
          }),
        },
      },
      description: 'Too many members',
    },
    403: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NoPermission, YouAreBlocked]),
          }),
        },
      },
      description: 'You do not have permission to add member to this list',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([ListNotFound, AccountNotFound]),
          }),
        },
      },
      description: 'List not found',
    },
  },
});

export const DeleteListMemberRoute = createRoute({
  method: 'delete',
  tags: ['timeline'],
  path: '/v0/lists/:id/members',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi('List ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            account_id: z.string().openapi('Account ID'),
          }),
        },
      },
    },
  },
  responses: {
    204: {
      description: 'OK',
    },
    403: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NoPermission, YouAreBlocked]),
          }),
        },
      },
      description: 'You do not have permission to remove member to this list',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([ListNotFound, AccountNotFound]),
          }),
        },
      },
      description: 'List not found',
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetHomeTimelineResponseSchema,
        },
      },
    },
    404: {
      description: 'Nothing left',
      content: {
        'application/json': {
          schema: z.object({
            error: NothingLeft,
          }),
        },
      },
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z.object({
            error: TimelineInternalError,
          }),
        },
      },
    },
  },
});

export const GetConversationRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/v0/timeline/conversations',
  request: {},
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetConversationsResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal error',
      content: {
        'application/json': {
          schema: z.object({
            error: TimelineInternalError,
          }),
        },
      },
    },
  },
});
