import { createRoute, z } from '@hono/zod-openapi';
import {
  NothingLeft,
  TimelineInternalError,
} from '../timeline/adaptor/presenter/errors.js';
import { GetNotificationsResponseSchema } from './adaptor/validator/schemas.js';

export const GetNotificationsRoute = createRoute({
  method: 'get',
  path: '/v0/notifications',
  description: 'Get notifications',
  tags: ['notification'],
  request: {
    query: z.object({
      limit: z.coerce.number().min(1).max(50).default(30).optional(),
      after_id: z.string().optional().openapi({
        description:
          'Return notes after this notification ID. Specified notification is not included.',
      }),
      include_read: z.coerce.boolean().default(false).optional(),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetNotificationsResponseSchema,
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

export const PostMakeAsReadNotificationRoute = createRoute({
  method: 'post',
  tags: ['notification'],
  path: '/v0/notifications/:id/read',
  request: {
    params: z.object({
      id: z.string().openapi({
        description: 'Notification ID',
      }),
    }),
  },
  responses: {
    204: {
      description: 'No content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z.object({
            error: z.literal('NO_PERMISSION'),
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
