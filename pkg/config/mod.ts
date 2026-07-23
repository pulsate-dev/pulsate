import { Ether } from '@mikuroxina/mini-fn';

import type { Config } from './model/config.ts';

export interface ConfigStore {
  fetch(): Config;
}
export const configStoreSymbol = Ether.newEtherSymbol<ConfigStore>();
