import { createRoute, z } from '@hono/zod-openapi';
import { InternalError } from '../accounts/adaptor/presenter/errors.js';
import { FileNotFound } from './adaptor/presenter/errors.js';
import { GetDriveMediaResponseSchema } from './adaptor/validator/schema.js';

export const GetMediaRoute = createRoute({
  method: 'get',
  path: '/v0/drive',
  tags: ['drive'],
  summary: 'Get uploaded media',
  security: [
    {
      bearer: [],
    },
  ],
  request: {},
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetDriveMediaResponseSchema,
        },
      },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: z.object({
            error: FileNotFound,
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            error: InternalError,
          }),
        },
      },
    },
  },
});
