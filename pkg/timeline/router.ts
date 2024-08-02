import { createRoute, z } from '@hono/zod-openapi';

import { CommonErrorResponseSchema } from '../accounts/adaptor/validator/schema.js';
import {
  CreateListRequestSchema,
  CreateListResponseSchema,
  EditListRequestSchema,
  EditListResponseSchema,
  FetchListResponseSchema,
  GetAccountTimelineResponseSchema,
  GetListMemberResponseSchema,
} from './adaptor/validator/timeline.js';

export const GetAccountTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/timeline/accounts/:id',
  request: {
    params: z.object({
      id: z.string().openapi('Account ID'),
    }),
    // NOTE: query params must use z.string()
    // cf. https://zenn.dev/loglass/articles/c237d89e238d42 (Japanese)
    // cf. https://github.com/honojs/middleware/issues/200#issuecomment-1773428171 (GitHub Issue)
    query: z.object({
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
          'Return notes before this note ID. specified note ID is not included',
      }),
    }),
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
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const CreateListRoute = createRoute({
  method: 'post',
  tags: ['timeline'],
  path: '/lists',
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
          schema: CommonErrorResponseSchema,
        },
      },
      description: 'TITLE_TOO_LONG',
    },
  },
});

export const EditListRoute = createRoute({
  method: 'patch',
  tags: ['timeline'],
  path: '/lists/:id',
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
      description: 'LIST_NOTFOUND',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    400: {
      description: 'TITLE_TOO_LONG',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const FetchListRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/lists/:id',
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
          schema: CommonErrorResponseSchema,
        },
      },
      description: 'LIST_NOTFOUND',
    },
  },
});

export const DeleteListRoute = createRoute({
  method: 'delete',
  tags: ['timeline'],
  path: '/lists',
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
          schema: CommonErrorResponseSchema,
        },
      },
      description: 'LIST_NOTFOUND',
    },
  },
});

export const GetListMemberRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/lists/:id/members',
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
          schema: CommonErrorResponseSchema,
        },
      },
      description: 'LIST_NOTFOUND',
    },
  },
});
