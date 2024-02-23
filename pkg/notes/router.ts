import { createRoute } from '@hono/zod-openapi';

import { CommonErrorResponseSchema } from '../accounts/adaptor/validator/schema.js';
import {
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
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
