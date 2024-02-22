import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { EditAccountService } from './editAccount.js';
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
const etagVerifyService = new EtagVerifyService();
const editAccountService = new EditAccountService(
  repository,
  etagVerifyService,
  new Argon2idPasswordEncoder(),
);

describe('EditAccountService', () => {
  afterEach(() => repository.reset());

  it('should be success to update nickname', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'new nickname',
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
    expect(account[1].getNickname()).toBe('new nickname');
  });

  it('should be fail to update nickname when nickname shorter more than 1', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      '',
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update nickname when nickname more than 256', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(257),
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update nickname when nickname 256', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(256),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
    expect(account[1].getNickname()).toBe('a'.repeat(256));
  });

  it('should be success to update nickname when nickname 1', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a',
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update nickname when etag not match', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const res = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'new nickname',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be fail to update nickname when account not found', async () => {
    const res = await editAccountService.editNickname(
      'invalid etag',
      '@foo@example.com',
      'new nickname',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be success to update passphrase', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'new password',
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update passphrase when passphrase shorter more than 8', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(7),
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update passphrase when passphrase longer more than 512', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(513),
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update passphrase when passphrase 8', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(8),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be success to update passphrase when passphrase 512', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editNickname(
      etag,
      '@john@example.com',
      'a'.repeat(512),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update passphrase when etag not match', async () => {
    const res = await editAccountService.editPassphrase(
      'invalid_etag',
      '@john@example.com',
      'new password',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be fail to update passphrase when account not found', async () => {
    const res = await editAccountService.editPassphrase(
      'invalid etag',
      '@john@example.com',
      'new password',
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be success to update email', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editEmail(
      etag,
      '@john@example.com',
      'pulsate@example.com',
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update email when etag not match', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const updateRes = await editAccountService.editEmail(
      'invalid_etag',
      '@john@example.com',
      'pulsate@example.com',
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update email when account not found', async () => {
    const updateRes = await editAccountService.editEmail(
      'invalid etag',
      '@john@example.com',
      'pulsate@pulsate.mail',
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update email when email shortest', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editEmail(
      etag,
      '@john@example.com',
      'a'.repeat(7),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be success to update email when email length 8', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editEmail(
      etag,
      '@john@example.com',
      'a'.repeat(8),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update email when email too long', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editEmail(
      etag,
      '@john@example.com',
      'a'.repeat(320),
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update email when email length 319', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editEmail(
      etag,
      '@john@example.com',
      'a'.repeat(319),
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be success to update bio', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    const etag = await etagVerifyService.generate(account[1]);
    const updateRes = await editAccountService.editBio(
      etag,
      '@john@example.com',
      'new bio',
    );

    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
    expect(account[1].getBio).toBe('new bio');
  });
});
