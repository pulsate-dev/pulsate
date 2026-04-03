import { describe, expect, it } from 'vitest';

import { Config } from './config.js';
import { ConfigInvalidError } from './errors.js';

const validArgs = {
  instanceName: 'Pulsate Demo Server',
  instanceFqdn: 'demo.pulsate.dev',
  openRegistration: true,
  maintainerAccount: '@pulsateprj@demo.pulsate.dev' as const,
  maintainerEmail: 'contact@pulsate.dev',
};

describe('Config', () => {
  it('should create config with valid args', () => {
    const config = Config.new(validArgs);

    expect(config.getInstanceName()).toBe('Pulsate Demo Server');
    expect(config.getInstanceFqdn()).toBe('demo.pulsate.dev');
    expect(config.isOpenRegistration()).toBe(true);
    expect(config.getMaintainerAccount()).toBe('@pulsateprj@demo.pulsate.dev');
    expect(config.getMaintainerEmail()).toBe('contact@pulsate.dev');
  });

  it('should throw when instanceName is empty', () => {
    expect(() => Config.new({ ...validArgs, instanceName: '' })).toThrow(
      ConfigInvalidError,
    );
  });

  it('should throw when instanceFqdn is empty', () => {
    expect(() => Config.new({ ...validArgs, instanceFqdn: '' })).toThrow(
      ConfigInvalidError,
    );
  });

  it('should throw when maintainerAccount is invalid format', () => {
    expect(() =>
      Config.new({ ...validArgs, maintainerAccount: '@@' as const }),
    ).toThrow(ConfigInvalidError);
  });

  it('should throw when maintainerEmail is empty', () => {
    expect(() => Config.new({ ...validArgs, maintainerEmail: '' })).toThrow(
      ConfigInvalidError,
    );
  });
});
