import { describe, expect, it } from 'vitest';
import { Instance, type InstanceID } from './instance.js';

describe('Instance', () => {
  it('should create new instance', () => {
    const res = Instance.new({
      id: '1' as InstanceID,
      name: 'Pulsate social',
      fqdn: new URL('https://social.example.com:3000'),
      softwareName: 'Pulsate',
      softwareVersion: '0.1.0',
      extentions: ['quote', 'emoji_reaction'],
      adminName: 'Pulsate project',
      description: 'pulsate official instance',
      adminContact: 'https://example.com/contact',
      isLocal: true,
      firstContact: new Date('2023-09-10T00:00:00.000Z'),
    });

    expect(res.getID()).toBe('1');
    expect(res.getName()).toBe('Pulsate social');
    expect(res.getFQDN()).toBe('social.example.com:3000');
    expect(res.getSoftwareName()).toBe('Pulsate');
    expect(res.getSoftwareVersion()).toBe('0.1.0');
    expect(res.getExtentions()).toStrictEqual(['quote', 'emoji_reaction']);
    expect(res.getAdminName()).toBe('Pulsate project');
    expect(res.getAdminContact()).toBe('https://example.com/contact');
    expect(res.isLocalInstance()).toBeTruthy();
    expect(res.getFirstContact()).toEqual(new Date('2023-09-10T00:00:00.000Z'));
  });

  it('should set Unknown/Unknwon if software version or name empty', () => {
    const res = Instance.new({
      id: '1' as InstanceID,
      name: 'Pulsate social',
      fqdn: new URL('https://social.example.com:3000'),
      softwareName: '',
      softwareVersion: '',
      extentions: ['quote', 'emoji_reaction'],
      adminName: 'Pulsate project',
      description: 'pulsate official instance',
      adminContact: 'https://example.com/contact',
      isLocal: true,
      firstContact: new Date('2023-09-10T00:00:00.000Z'),
    });

    expect(res.getSoftwareName()).toBe('Unknown');
    expect(res.getSoftwareVersion()).toBe('Unknown');
  });
});
