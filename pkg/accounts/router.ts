import { createRoute, z } from 'hono/zod-openapi';

const CreateAccountRequestSchema = z.object({
  // ToDo: 文字種制約/先頭,末尾制約の実装
  name: z.string().min(3).max(64).openapi({
    example: 'example_man',
  }),
  email: z.string().email().openapi({ example: 'foo@example.com' }),
  passphrase: z.string().min(8).max(512).openapi({
    example: 'じゃすた・いぐざんぽぅ',
  }),
  captcha_token: z.string(),
}).openapi('CreateAccountRequest');

const CreateAccountResponseSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
  }),
  name: z.string().openapi({ example: 'example_man@example.com' }),
  email: z.string().email().openapi({ example: 'foo@example.com' }),
}).openapi('CreateAccountResponse');

export const CreateAccountRoute = createRoute({
  method: 'post',
  path: '/accounts',
  request: {
    body: {
      content: {
        'application/json': { schema: CreateAccountRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': { schema: CreateAccountResponseSchema },
      },
    },
  },
});
