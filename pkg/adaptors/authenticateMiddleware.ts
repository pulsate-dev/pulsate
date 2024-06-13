import { Ether, Option } from '@mikuroxina/mini-fn';
import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import {
  authenticateTokenSymbol,
  type AuthenticationTokenService,
} from '../accounts/service/authenticationTokenService.js';

export class AuthenticateMiddlewareService {
  private readonly authTokenService: AuthenticationTokenService;

  constructor(authTokenService: AuthenticationTokenService) {
    this.authTokenService = authTokenService;
  }

  private parseToken(token: string): Option.Option<string> {
    const split = token.split('.')[1];
    if (!split) {
      return Option.none();
    }
    const payload = JSON.parse(
      Buffer.from(split, 'base64').toString('utf-8'),
    ) as { sub: string };
    return Option.some(payload.sub);
  }

  /**
   *
   * @param options forceAuthorized: if false, allow request without token
   * @returns Hono middleware handler object
   */
  handle(options: { forceAuthorized: boolean }): MiddlewareHandler {
    return createMiddleware(async (c, next) => {
      const rawToken = c.req.header('Authorization');
      if (!rawToken) {
        if (options.forceAuthorized) {
          return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        c.set('isValidToken', false);
        return await next();
      }

      const token = rawToken.split(' ')[1];
      if (!token) {
        return c.json({ error: 'UNAUTHORIZED', status: 401 });
      }
      c.set('token', token);

      const isValidToken = await this.authTokenService.verify(token);
      const accountName = this.parseToken(token);
      if (!isValidToken) {
        return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      if (Option.isNone(accountName)) {
        return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      c.set('accountName', accountName);
      return await next();
    });
  }
}
export const authenticateMiddlewareSymbol =
  Ether.newEtherSymbol<AuthenticateMiddlewareService>();
export const authenticateMiddleware = Ether.newEther(
  authenticateMiddlewareSymbol,
  ({ authTokenService }) => new AuthenticateMiddlewareService(authTokenService),
  {
    authTokenService: authenticateTokenSymbol,
  },
);
