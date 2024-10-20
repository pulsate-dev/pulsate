import { createRoute, z } from '@hono/zod-openapi';

import { AccountNotFound } from '../accounts/adaptor/presenter/errors.js';
import {
  AlreadyReacted,
  AttachmentNotFound,
  EmojiNotFound,
  InvalidVisibility,
  NoDestination,
  NotReacted,
  NoteInternal,
  NoteNotFound,
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
        },
      },
    },
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
          schema: z
            .object({
              error: NoteNotFound,
            })
            .openapi({
              description: 'Note not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
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
    body: {
      content: {
        'application/json': {
          schema: CreateReactionRequestSchema,
        },
      },
    },
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
          schema: z.object({
            error: z.union([AlreadyReacted, EmojiNotFound]).openapi({
              description: 'Error codes',
              example: 'ALREADY_REACTED',
            }),
          }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z.object({
            error: NoteNotFound,
          }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
        },
      },
    },
  },
});

export const DeleteReactionRoute = createRoute({
  method: 'delete',
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
    204: {
      description: 'OK',
    },
    404: {
      description: 'Reaction not found',
      content: {
        'application/json': {
          schema: z.object({
            error: NotReacted,
          }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
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
          schema: z
            .object({
              error: NoteNotFound,
            })
            .openapi({
              description: 'Note not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
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
          schema: z.object({
            error: NoteNotFound,
          }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoteInternal,
            })
            .openapi({
              description: 'Internal Error',
            }),
        },
      },
    },
  },
});
