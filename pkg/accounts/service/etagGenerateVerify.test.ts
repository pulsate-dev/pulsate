import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { EtagVerifyService } from './etagGenerateVerify.js';

const repository = new InMemoryAccountRepository();
await repository.create(
  Account.new({
    id: '1' as ID<AccountID>,
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
const etagVerifyService: EtagVerifyService = new EtagVerifyService();

describe('EtagVerifyService', () => {
  afterEach(() => repository.reset());

  it('success to verify etag', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const result = await etagVerifyService.verify(account[1], etag);
    expect(result).toBe(true);
  });

  it('failed to verify etag', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = `${await etagVerifyService.generate(account[1])}_invalid`;
    const result = await etagVerifyService.verify(account[1], etag);
    expect(result).toBe(false);
  });

  it('should return string which is 64 characters long', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    expect(etag.length).toBe(64);
  });
});
