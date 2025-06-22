import { Ether, Option } from '@mikuroxina/mini-fn';

import { type Captcha, captchaSymbol } from '../../model/captcha.js';
import { AccountCaptchaTokenInvalidError } from '../../model/errors.js';

export class TurnstileCaptchaValidator implements Captcha {
  constructor(private readonly secret: string) {}

  async validate(token: string): Promise<Option.Option<Error>> {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        body: JSON.stringify({
          // ToDo: load settings from config file
          secret: this.secret,
          response: token,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
    const response = await res.json();
    if (!response.success) {
      const { success: _success, ...rest } = response;
      return Option.some(
        new AccountCaptchaTokenInvalidError('failed to verify captcha token', {
          cause: rest,
        }),
      );
    }

    return Option.none();
  }
}

export const newTurnstileCaptchaValidator = (secret: string) =>
  Ether.newEther(captchaSymbol, () => new TurnstileCaptchaValidator(secret));
