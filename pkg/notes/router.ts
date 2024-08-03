import { createRoute, z } from '@hono/zod-openapi';

import { CommonErrorResponseSchema } from '../accounts/adaptor/validator/schema.js';
import {
  CreateBookmarkResponseSchema,
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  CreateReactionResponseSchema,
  GetNoteResponseSchema,
  RenoteRequestSchema,
  RenoteResponseSchema,
} from './adaptor/validator/schema.js';

export const CreateNoteRoute = createRoute({
  method: 'post',
  tags: ['notes'],
  path: '/notes',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateNoteRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: CreateNoteResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'You are silenced',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    // ToDo: Define 404 (Attachment not found/Send to Account not found)
  },
});

export const GetNoteRoute = createRoute({
  method: 'get',
  tags: ['notes'],
  path: '/notes/:id',
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Note ID',
        example: '1',
      }),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetNoteResponseSchema,
        },
      },
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const RenoteRoute = createRoute({
  method: 'post',
  tags: ['notes'],
  path: '/notes/:id/renote',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Note ID',
        example: '1',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: RenoteRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: RenoteResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'You are silenced',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const CreateReactionRoute = createRoute({
  method: 'post',
  tags: ['reaction'],
  path: '/notes/:id/reaction',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Note ID',
        example: '1',
      }),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: CreateReactionResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const CreateBookmarkRoute = createRoute({
  method: 'post',
  tags: ['bookmark'],
  path: '/notes/:id/bookmark',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Note ID',
        example: '1',
      }),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: CreateBookmarkResponseSchema,
        },
      },
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const DeleteBookmarkRoute = createRoute({
  method: 'delete',
  tags: ['bookmark'],
  path: '/notes/:id/bookmark',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Note ID',
        example: '1',
      }),
    }),
  },
  responses: {
    204: {
      description: 'OK',
    },
    404: {
      description: 'Bookmark not found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});
