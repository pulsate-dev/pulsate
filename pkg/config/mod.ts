import { Ether } from '@mikuroxina/mini-fn';

import type { Config } from './model/config.js';

export interface ConfigStore {
  fetch(): Config;
}
export const configStoreSymbol = Ether.newEtherSymbol<ConfigStore>();
