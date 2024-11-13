import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { Account, type AccountID } from '../model/account.js';
import { EtagService } from './etagService.js';

const repository = new InMemoryAccountRepository();
await repository.create(
  Account.new({
    id: '1' as AccountID,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    nickname: 'John Doe',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'notActivated',
    createdAt: new Date(),
  }),
);
const etagService: EtagService = new EtagService();

describe('etagService', () => {
  afterEach(() => repository.reset());

  it('success to verify etag', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagService.generate(account[1]);
    const result = await etagService.verify(account[1], etag);
    expect(result).toBe(true);
  });

  it('failed to verify etag', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = `${await etagService.generate(account[1])}_invalid`;
    const result = await etagService.verify(account[1], etag);
    expect(result).toBe(false);
  });

  it('should return string which is 64 characters long', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagService.generate(account[1]);
    expect(etag.length).toBe(64);
  });
});
