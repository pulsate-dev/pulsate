import { describe, expect, it } from 'vitest';

import { Config } from '../model/config.js';
import { DummyConfigStore } from './dummy.js';

const testConfig = Config.new({
  instanceName: 'Pulsate Demo Server',
  instanceFqdn: 'demo.pulsate.dev',
  openRegistration: true,
  maintainerAccount: '@pulsateprj@demo.pulsate.dev',
  maintainerEmail: 'contact@pulsate.dev',
});

describe('DummyConfigStore', () => {
  it('should return the config', () => {
    const store = new DummyConfigStore(testConfig);
    const config = store.fetch();

    expect(config.getInstanceName()).toBe('Pulsate Demo Server');
    expect(config.getInstanceFqdn()).toBe('demo.pulsate.dev');
    expect(config.isOpenRegistration()).toBe(true);
    expect(config.getMaintainerAccount()).toBe('@pulsateprj@demo.pulsate.dev');
    expect(config.getMaintainerEmail()).toBe('contact@pulsate.dev');
  });
});
