import { createRoute, z } from '@hono/zod-openapi';
import { InternalError } from '../accounts/adaptor/presenter/errors.ts';
import {
  bearerAuth,
  errorResponse,
  internalErrorResponse,
  okResponse,
} from '../internal/router/helper.ts';
import { FileNotFound } from './adaptor/presenter/errors.ts';
import { GetDriveMediaResponseSchema } from './adaptor/validator/schema.ts';

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
    500: internalErrorResponse(
      driveInternalErrorSchema,
      'Internal server error',
    ),
  },
});
