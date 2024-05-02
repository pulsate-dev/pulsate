import { createRoute, z } from '@hono/zod-openapi';
import { CommonErrorResponseSchema } from '~/accounts/adaptor/validator/schema.js';

import {
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  GetNoteResponseSchema,
  RenoteRequestSchema,
  RenoteResponseSchema,
} from './adaptor/validator/schema.js';

export const CreateNoteRoute = createRoute({
  method: 'post',
  tags: ['notes'],
  path: '/notes',
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
