import { Ether, Option } from '@mikuroxina/mini-fn';

import { type Captcha, captchaSymbol } from '../../model/captcha.js';

export class TurnstileCaptchaValidator implements Captcha {
  async validate(token: string): Promise<Option.Option<Error>> {
    console.log(token);
    await fetch('');
    return Option.none();
  }
}
export const newTurnstileCaptchaValidator = Ether.newEther(
  captchaSymbol,
  () => new TurnstileCaptchaValidator(),
);
