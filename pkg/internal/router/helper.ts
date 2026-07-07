import { z } from '@hono/zod-openapi';

export const bearerAuth = (): { bearer: [] }[] => [{ bearer: [] }];

export const jsonBody = <S>(
  schema: S,
): {
  content: { 'application/json': { schema: S } };
} => ({
  content: { 'application/json': { schema } },
});

export const okResponse = <S>(
  schema: S,
  description = 'OK',
): {
  description: string;
  content: { 'application/json': { schema: S } };
} => ({
  description,
  content: { 'application/json': { schema } },
});

export const noContentResponse = (
  description = 'No Content',
): { description: string } => ({
  description,
});

export const internalErrorResponse = <S>(
  internalErrorSchema: S,
): {
  description: string;
  content: { 'application/json': { schema: S } };
} => ({
  description: 'Internal Server Error',
  content: { 'application/json': { schema: internalErrorSchema } },
});

export const errorResponse = <E>(
  description: string,
  error: E,
): {
  description: string;
  content: { 'application/json': { schema: ReturnType<typeof z.object> } };
} => ({
  description,
  content: {
    'application/json': {
      schema: z.object({ error }),
    },
  },
});
