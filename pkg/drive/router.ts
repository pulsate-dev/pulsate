import { createRoute, z } from '@hono/zod-openapi';
import { InternalError } from '../accounts/adaptor/presenter/errors.js';
import {
  bearerAuth,
  errorResponse,
  internalErrorResponse,
  okResponse,
} from '../internal/router/helper.js';
import { FileNotFound } from './adaptor/presenter/errors.js';
import { GetDriveMediaResponseSchema } from './adaptor/validator/schema.js';

const driveInternalErrorSchema = z.object({ error: InternalError });

export const GetMediaRoute = createRoute({
  method: 'get',
  path: '/v0/drive',
  tags: ['drive'],
  summary: 'Get uploaded media',
  security: bearerAuth(),
  request: {},
  responses: {
    200: okResponse(GetDriveMediaResponseSchema),
    404: errorResponse('Not found', FileNotFound),
    500: internalErrorResponse(driveInternalErrorSchema),
  },
});
