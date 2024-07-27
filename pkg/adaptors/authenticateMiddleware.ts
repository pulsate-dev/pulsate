import { Ether, Option } from '@mikuroxina/mini-fn';
import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import {
  type AuthenticationTokenService,
  authenticateTokenSymbol,
} from '../accounts/service/authenticationTokenService.js';

/* eslint-disable-next-line @typescript-eslint/consistent-type-definitions */
export type AuthMiddlewareVariable = {
  /*
   * @description authorization token (JWT, ES256)
   */
  token: string;
  /*
   * @description account name, or none if not authorized
   */
  accountID: Option.Option<string>;
};

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
   * @param {Object} options - Configuration of this middleware.
   * @param {boolean} options.forceAuthorized - Requires an access token oin the request if true, or not.
   * @returns Hono middleware handler object
   */
  handle(options: {
    forceAuthorized: boolean;
  }): MiddlewareHandler<{ Variables: AuthMiddlewareVariable }> {
    return createMiddleware(async (c, next) => {
      const rawToken = c.req.header('Authorization');
      if (!rawToken) {
        if (options.forceAuthorized) {
          return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }
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

      c.set('accountID', accountName);
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
