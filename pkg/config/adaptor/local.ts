import { readFileSync } from 'node:fs';

import { Ether } from '@mikuroxina/mini-fn';
import { parse } from 'yaml';

import { type ConfigStore, configStoreSymbol } from '../mod.js';
import { type AccountName, Config } from '../model/config.js';

export class LocalConfigStore implements ConfigStore {
  private readonly config: Config;

  constructor(filePath: string) {
    const content = readFileSync(filePath, 'utf-8');
    const data = parse(content);

    this.config = Config.new({
      instanceName: data.instance_name,
      instanceFqdn: data.instance_fqdn,
      openRegistration: data.open_registration,
      maintainerAccount: data.maintainer_account as AccountName,
      maintainerEmail: data.maintainer_email,
    });
  }

  fetch(): Config {
    return this.config;
  }
}

export const localConfigStore = (filePath: string) =>
  Ether.newEther(configStoreSymbol, () => new LocalConfigStore(filePath));
