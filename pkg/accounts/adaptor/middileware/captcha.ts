import { Ether, Option } from '@mikuroxina/mini-fn';
import { createMiddleware } from 'hono/factory';

import { type Captcha, captchaSymbol } from '../../model/captcha.js';

export class CaptchaMiddleware {
  constructor(private readonly captcha: Captcha) {}

  handle() {
    return createMiddleware(async (c, next) => {
      const req = (await c.req.json()) as { captcha_token: string };
      if (!req.captcha_token) {
        c.res = undefined;
        c.res = new Response(
          JSON.stringify({ error: 'captcha token is required' }),
          {
            status: 400,
          },
        );
        return;
      }
      const isValidToken = Option.isNone(
        await this.captcha.validate(req.captcha_token),
      );
      if (!isValidToken) {
        c.res = undefined;
        c.res = new Response(
          JSON.stringify({ error: 'captcha token is required' }),
          {
            status: 400,
          },
        );
        return;
      }
      await next();
    });
  }
}
export const captchaMiddlewareSymbol =
  Ether.newEtherSymbol<CaptchaMiddleware>();
export const captchaMiddleware = Ether.newEther(
  captchaMiddlewareSymbol,
  ({ captcha }) => new CaptchaMiddleware(captcha),
  {
    captcha: captchaSymbol,
  },
);
