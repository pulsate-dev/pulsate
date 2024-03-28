import { createRoute, z } from '@hono/zod-openapi';

import {
  GetTimelineResponseSchema,
  CommonErrorResponseSchema,
} from './adaptor/validator/schema.js';

export const GetTimelineRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/timeline/:type',
  request: {
    params: z.object({
      type: z.enum(['home', 'global']).optional().default('home'),
    }),
    query: z.object({
      has_attachment: z.boolean().optional().default(false),
      no_nsfw: z.boolean().optional().default(false),
      before_id: z
        .string()
        .regex(/^\d{64}$/)
        .optional(),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: GetTimelineResponseSchema } },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: CommonErrorResponseSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: CommonErrorResponseSchema } },
    },
  },
});

const AccountNameSchema = z.string().regex(/^@\w+@\w+$/);
const IDSchema = z.string().regex(/^\d{64}$/);

export const GetTimelineByAccountRoute = createRoute({
  method: 'get',
  tags: ['timeline'],
  path: '/timeline/accounts/:spec',
  request: {
    params: z.object({
      spec: IDSchema.or(AccountNameSchema),
    }),
    query: z.object({
      has_attachment: z.boolean().optional().default(false),
      no_nsfw: z.boolean().optional().default(false),
      before_id: z
        .string()
        .regex(/^\d{64}$/)
        .optional(),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: GetTimelineResponseSchema } },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: CommonErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: CommonErrorResponseSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: CommonErrorResponseSchema } },
    },
  },
});
