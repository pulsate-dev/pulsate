import { OpenAPIHono } from '@hono/zod-openapi';
import type { AuthMiddlewareVariable } from '../adaptors/authenticateMiddleware.ts';
import { accountHandlers } from './handler/account.ts';
import { authHandlers } from './handler/auth.ts';
import { followHandlers } from './handler/follow.ts';
import { mediaHandlers } from './handler/media.ts';

export const accounts = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();
accounts.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});
accounts.doc31('/accounts/doc.json', {
  openapi: '3.1.0',
  info: { title: 'Accounts API', version: '0.1.0' },
});
accounts.route('/', accountHandlers);
accounts.route('/', authHandlers);
accounts.route('/', followHandlers);
accounts.route('/', mediaHandlers);
