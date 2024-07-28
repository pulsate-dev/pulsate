import { createRoute } from '@hono/zod-openapi';

import { CommonErrorResponseSchema } from '../accounts/adaptor/validator/schema.js';
import { GetDriveMediaResponseSchema } from './adaptor/validator/schema.js';

export const GetMediaRoute = createRoute({
  method: 'get',
  path: '/drive',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});
