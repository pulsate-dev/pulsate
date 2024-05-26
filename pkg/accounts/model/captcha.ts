import { Ether, type Option } from '@mikuroxina/mini-fn';

/**
 * Captcha Interface
 */
export interface Captcha {
  validate(token: string): Promise<Option.Option<Error>>;
}
export const captchaSymbol = Ether.newEtherSymbol<Captcha>();
