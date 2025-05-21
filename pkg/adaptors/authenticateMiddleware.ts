import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { z } from '@hono/zod-openapi';
import { controller } from '../accounts/mod.js';

/* eslint-disable-next-line @typescript-eslint/consistent-type-definitions */
export type AuthMiddlewareVariable = {
  /*
   * @description authorization token (JWT, ES256)
   */
  token: string;
  /*
   * @description account id, or none if not authorized
   */
  accountID: Option.Option<string>;
  /*
   * @description account name, or none if not authorized
   */
  accountName: Option.Option<string>;
};

const tokenPayloadSchema = z.object({
  sub: z.string(),
  accountName: z.string(),
});

export class AuthenticateMiddlewareService {
  private parseToken(
    token: string,
  ): Option.Option<z.infer<typeof tokenPayloadSchema>> {
    const split = token.split('.')[1];
    if (!split) {
      return Option.none();
    }
    const payload = JSON.parse(Buffer.from(split, 'base64').toString('utf-8'));

    const parsed = tokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return Option.none();
    }

    return Option.some({
      sub: parsed.data.sub,
      accountName: parsed.data.accountName,
    });
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
        c.set('accountName', Option.none());
        c.set('accountID', Option.none());
        return await next();
      }

      const token = rawToken.split(' ')[1];
      if (!token) {
        return c.json({ error: 'UNAUTHORIZED', status: 401 });
      }
      c.set('token', token);

      const isValidToken = Result.isOk(await controller.verifyAuthToken(token));
      const parsed = this.parseToken(token);
      if (!isValidToken) {
        return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      if (Option.isNone(parsed)) {
        return c.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const unwrapped = Option.unwrap(parsed);
      c.set('accountID', Option.some(unwrapped.sub));
      c.set('accountName', Option.some(unwrapped.accountName));
      return await next();
    });
  }
}
export const authenticateMiddlewareSymbol =
  Ether.newEtherSymbol<AuthenticateMiddlewareService>();
export const authenticateMiddleware = Ether.newEther(
  authenticateMiddlewareSymbol,
  () => new AuthenticateMiddlewareService(),
);
