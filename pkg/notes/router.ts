import { createRoute, z } from '@hono/zod-openapi';

import { AccountNotFound } from '../accounts/adaptor/presenter/errors.js';
import {
  bearerAuth,
  errorResponse,
  internalErrorResponse,
  jsonBody,
  noContentResponse,
  okResponse,
} from '../internal/router/helper.js';
import {
  AlreadyReacted,
  AttachmentNotFound,
  EmojiNotFound,
  InvalidVisibility,
  NoDestination,
  NoteInternal,
  NoteNotFound,
  NotReacted,
  TooManyAttachments,
  TooManyContent,
  YouAreSilenced,
} from './adaptor/presenter/errors.js';
import {
  CreateBookmarkResponseSchema,
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  CreateReactionRequestSchema,
  CreateReactionResponseSchema,
  GetNoteResponseSchema,
  RenoteRequestSchema,
  RenoteResponseSchema,
} from './adaptor/validator/schema.js';

const noteInternalErrorSchema = z
  .object({ error: NoteInternal })
  .openapi({ description: 'Internal Error' });

const noteIDParams = () =>
  z.object({
    id: z.string().openapi({
      description: 'Note ID',
      example: '1',
    }),
  });

export const CreateNoteRoute = createRoute({
  method: 'post',
  tags: ['notes'],
  path: '/v0/notes',
  security: bearerAuth(),
  request: {
    body: jsonBody(CreateNoteRequestSchema),
  },
  responses: {
    200: okResponse(CreateNoteResponseSchema),
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z
              .union([
                TooManyAttachments,
                TooManyContent,
                NoDestination,
                InvalidVisibility,
              ])
              .openapi({
                description: 'Error codes',
                example: 'TOO_MANY_ATTACHMENTS',
              }),
          }),
        },
      },
    },
    403: {
      description: 'You are silenced',
      content: {
        'application/json': {
          schema: z
            .object({
              error: YouAreSilenced,
            })
            .openapi({
              description: "You can't set note visibility to PUBLIC",
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([AttachmentNotFound, AccountNotFound]).openapi({
              description: 'Error codes',
              example: 'ATTACHMENT_NOT_FOUND',
            }),
          }),
        },
      },
    },
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const GetNoteRoute = createRoute({
  method: 'get',
  tags: ['notes'],
  path: '/v0/notes/:id',
  request: {
    params: noteIDParams(),
  },
  responses: {
    200: okResponse(GetNoteResponseSchema),
    404: errorResponse('Note not found', NoteNotFound, 'Note not found'),
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const RenoteRoute = createRoute({
  method: 'post',
  tags: ['notes'],
  path: '/v0/notes/:id/renote',
  security: bearerAuth(),
  request: {
    params: noteIDParams(),
    body: jsonBody(RenoteRequestSchema),
  },
  responses: {
    200: okResponse(RenoteResponseSchema),
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z
              .union([
                TooManyContent,
                TooManyAttachments,
                InvalidVisibility,
                NoDestination,
              ])
              .openapi({
                description: 'Error codes',
                example: 'TOO_MANY_CONTENT',
              }),
          }),
        },
      },
    },
    403: {
      description: 'You are silenced',
      content: {
        'application/json': {
          schema: z
            .object({
              error: YouAreSilenced,
            })
            .openapi({
              description: "You can't set note visibility to PUBLIC",
            }),
        },
      },
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([NoteNotFound, AttachmentNotFound]).openapi({
              description: 'Error codes',
              example: 'NOTE_NOT_FOUND',
            }),
          }),
        },
      },
    },
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const CreateReactionRoute = createRoute({
  method: 'post',
  tags: ['reaction'],
  path: '/v0/notes/:id/reaction',
  security: bearerAuth(),
  request: {
    params: noteIDParams(),
    body: jsonBody(CreateReactionRequestSchema),
  },
  responses: {
    200: okResponse(CreateReactionResponseSchema),
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([AlreadyReacted, EmojiNotFound]).openapi({
              description: 'Error codes',
              example: 'ALREADY_REACTED',
            }),
          }),
        },
      },
    },
    404: errorResponse('Not Found', NoteNotFound),
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const DeleteReactionRoute = createRoute({
  method: 'delete',
  tags: ['reaction'],
  path: '/v0/notes/:id/reaction',
  security: bearerAuth(),
  request: {
    params: noteIDParams(),
  },
  responses: {
    204: noContentResponse('OK'),
    404: errorResponse('Reaction not found', NotReacted),
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const CreateBookmarkRoute = createRoute({
  method: 'post',
  tags: ['bookmark'],
  path: '/v0/notes/:id/bookmark',
  security: bearerAuth(),
  request: {
    params: noteIDParams(),
  },
  responses: {
    200: okResponse(CreateBookmarkResponseSchema),
    404: errorResponse('Note not found', NoteNotFound, 'Note not found'),
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});

export const DeleteBookmarkRoute = createRoute({
  method: 'delete',
  tags: ['bookmark'],
  path: '/v0/notes/:id/bookmark',
  security: bearerAuth(),
  request: {
    params: noteIDParams(),
  },
  responses: {
    204: noContentResponse('OK'),
    404: errorResponse('Bookmark not found', NoteNotFound),
    500: internalErrorResponse(noteInternalErrorSchema),
  },
});
