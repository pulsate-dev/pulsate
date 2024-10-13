import { z } from '@hono/zod-openapi';

export const FileNotFound = z.literal('FILE_NOT_FOUND').openapi({
  description: 'File not found',
});
