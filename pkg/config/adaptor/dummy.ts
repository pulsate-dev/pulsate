import { Ether } from '@mikuroxina/mini-fn';
import { type ConfigStore, configStoreSymbol } from '../mod.ts';
import type { Config } from '../model/config.ts';

export class DummyConfigStore implements ConfigStore {
  readonly #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  fetch(): Config {
    return this.#config;
  }
}

export const dummyConfigStore = (config: Config) =>
  Ether.newEther(configStoreSymbol, () => new DummyConfigStore(config));
