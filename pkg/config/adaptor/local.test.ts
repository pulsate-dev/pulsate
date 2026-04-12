import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ConfigInvalidError } from '../model/errors.js';
import { LocalConfigStore } from './local.js';

describe('LocalConfigStore', () => {
  const createTempConfig = (content: string): string => {
    const dir = mkdtempSync(join(tmpdir(), 'pulsate-config-test-'));
    const filePath = join(dir, 'config.yaml');
    writeFileSync(filePath, content);
    return filePath;
  };

  it('should load config from a valid YAML file', () => {
    const filePath = createTempConfig(`
instance_name: "Pulsate Demo Server"
instance_fqdn: "demo.pulsate.dev"
open_registration: true
maintainer_account: "@pulsateprj@demo.pulsate.dev"
maintainer_email: "contact@pulsate.dev"
`);

    const store = new LocalConfigStore(filePath);
    const config = store.fetch();

    expect(config.getInstanceName()).toBe('Pulsate Demo Server');
    expect(config.getInstanceFqdn()).toBe('demo.pulsate.dev');
    expect(config.isOpenRegistration()).toBe(true);
    expect(config.getMaintainerAccount()).toBe('@pulsateprj@demo.pulsate.dev');
    expect(config.getMaintainerEmail()).toBe('contact@pulsate.dev');

    rmSync(join(filePath, '..'), { recursive: true });
  });

  it('should throw when file does not exist', () => {
    expect(() => new LocalConfigStore('/nonexistent/path.yaml')).toThrow();
  });

  it('should throw ConfigInvalidError when required field is empty', () => {
    const filePath = createTempConfig(`
instance_name: ""
instance_fqdn: "demo.pulsate.dev"
open_registration: true
maintainer_account: "@pulsateprj@demo.pulsate.dev"
maintainer_email: "contact@pulsate.dev"
`);

    expect(() => new LocalConfigStore(filePath)).toThrow(ConfigInvalidError);

    rmSync(join(filePath, '..'), { recursive: true });
  });

  it('should throw when YAML is malformed', () => {
    const filePath = createTempConfig('{{{invalid yaml');

    expect(() => new LocalConfigStore(filePath)).toThrow();

    rmSync(join(filePath, '..'), { recursive: true });
  });
});
