import { Ether } from '@mikuroxina/mini-fn';
import { type ConfigStore, configStoreSymbol } from '../mod.js';
import type { Config } from '../model/config.js';

export class DummyConfigStore implements ConfigStore {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  fetch(): Config {
    return this.config;
  }
}

export const dummyConfigStore = (config: Config) =>
  Ether.newEther(configStoreSymbol, () => new DummyConfigStore(config));
