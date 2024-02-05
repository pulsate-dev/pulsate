import { Result } from '@mikuroxina/mini-fn';
import { describe, it, expect, afterEach } from 'vitest';

import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository
} from '../adaptor/repository/dummy.js';
import { type AccountName, type AccountRole } from '../model/account.js';
import { EditAccountService } from './editAccount.js';
import { EtagVerifyService } from './etagGenerateVerify.js';
import { RegisterAccountService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';
import { TokenVerifyService } from './tokenVerify.js';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}
const registerService: RegisterAccountService = new RegisterAccountService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new Argon2idPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(verifyRepository)
});
const etagVerifyService = new EtagVerifyService();
const editAccountService = new EditAccountService(
  repository,
  etagVerifyService,
  new Argon2idPasswordEncoder()
);

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole
};

describe('EditAccountService', () => {
  afterEach(() => repository.reset());
  it('should be success to update nickname', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'new nickname'
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
    expect(account.getNickname).toBe('new nickname');
  });

  it('should be fail to update nickname when nickname shorter more than 1', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      ''
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update nickname when nickname more than 256', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'a'.repeat(257)
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update nickname when nickname 256', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'a'.repeat(256)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
    expect(account.getNickname).toBe('a'.repeat(256));
  });

  it('should be success to update nickname when nickname 1', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'a'
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update nickname when etag not match', async () => {
    await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );

    const res = await editAccountService.editNickname(
      'invalid_etag',
      exampleInput.name,
      'new nickname'
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be fail to update nickname when account not found', async () => {
    const res = await editAccountService.editNickname(
      'invalid etag',
      'foo',
      'new nickname'
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be success to update passphrase', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'new password'
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update passphrase when passphrase shorter more than 8', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(7)
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update passphrase when passphrase longer more than 512', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(513)
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update passphrase when passphrase 8', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(8)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be success to update passphrase when passphrase 512', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(512)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update passphrase when etag not match', async () => {
    await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );

    const res = await editAccountService.editPassphrase(
      'invalid_etag',
      exampleInput.name,
      'new password'
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be fail to update passphrase when account not found', async () => {
    const res = await editAccountService.editPassphrase(
      'invalid etag',
      'foo',
      'new password'
    );
    expect(Result.isErr(res)).toBe(true);
  });

  it('should be success to update email', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'pulsate@example.com'
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update email when etag not match', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    Result.unwrap(res);

    const updateRes = await editAccountService.editEmail(
      'invalid_etag',
      exampleInput.name,
      'pulsate@example.com'
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be fail to update email when account not found', async () => {
    const updateRes = await editAccountService.editEmail(
      'invalid etag',
      'foo',
      'pulsate@pulsate.mail'
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update email when email shortest', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'a'.repeat(7)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be success to update email when email length 8', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'a'.repeat(8)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });

  it('should be fail to update email when email too long', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'a'.repeat(320)
    );
    expect(Result.isErr(updateRes)).toBe(true);
  });

  it('should be success to update email when email length 319', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role
    );
    const account = Result.unwrap(res);
    expect(Result.isErr(res)).toBe(false);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'a'.repeat(319)
    );
    expect(Result.isErr(updateRes)).toBe(false);
    expect(updateRes[1]).toBe(true);
  });
});
