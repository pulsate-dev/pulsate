import { Ether } from '@mikuroxina/mini-fn';
import { createMiddleware } from 'hono/factory';

import { type Captcha, captchaSymbol } from '../../model/captcha.js';

export class CaptchaMiddleware {
  constructor(private readonly captcha: Captcha) {}

  handle() {
    return createMiddleware(async (c, next) => {
      console.log(c.body);
      await this.captcha.validate('');
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
